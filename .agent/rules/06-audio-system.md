<!-- Arsitektur subsistem audio, UNIX pipeline, Rust CPAL native audio engine, mitigasi speaker eksternal (Bluetooth/USB/Wi-Fi), dan aturan isolasi -->
# 06 — Typing Sound & Audio Subsystem Governance

Dokumen ini mendefinisikan arsitektur modular, kontrak antarmuka, dan aturan isolasi mutlak subsistem audio di **Typing FreeX**.

---

## 1. Filosofi & Pipeline UNIX Subsistem Audio

Subsistem audio dirancang dengan pemisahan mekanisme komputasi dari kebijakan UI (*UNIX Rule of Separation*):

```
[sound-preloader.ts]        --> Stage 1: Eager WAV Fetch & Synthesizer Buffer Registration
         │
[sound-synthesizer.ts]      --> Stage 2: Oscillator, Scale (Pentatonic/Wholetone), Tone Synthesis
         │
[typing-sound.controller]   --> Stage 3: Svelte 5 Policy Controller (Pack resolution, Sound on/off)
         │
[sound-engine.ts]           --> Stage 4: Engine Selector (AdaptiveSoundEngine on Tauri, Web Audio Fallback on Browser/Test)
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
[native-sound-engine.ts]     [HybridSoundEngine]
(Desktop Tauri v2 IPC)       (Headless Vitest / Web Fallback)
    │
    ▼
[commands/audio.rs]         --> Stage 5: Non-blocking Tauri Command Dispatch (`audio_play`)
    │
    ▼
[audio/engine.rs & mixer.rs]--> Stage 6: 64-Voice Real-Time Mixer (zero allocation, rational soft-clip)
    │
    ▼
[audio/device.rs (CPAL)]    --> Stage 7: Hardware OS Audio Stream (PulseAudio / pipewire-pulse / ALSA; Cargo feature `pulseaudio` tanpa `pipewire` agar bebas ketergantungan build `libpipewire-0.3-dev`)
                                 -> Universal Output: Mono, Stereo, Multichannel (5.1/7.1), Bluetooth A2DP, USB DAC, 3.5mm Jack, Wi-Fi
```

---

## 2. Aturan Mutlak untuk AI Agent

1. **Pemrosesan Audio Native di Backend Rust (`src-tauri/src/audio/`)**:
   Seluruh pemutaran audio pengetikan pada aplikasi desktop Tauri v2 diserahkan secara eksklusif ke backend Rust menggunakan library audio native CPAL (`src-tauri/src/audio/`).
   - DILARANG menggunakan ring buffer `HTMLAudioElement` di webview WebKitGTK. Multi-instance `HTMLAudioElement` berbasis GStreamer memicu lag parah, input delay 50–80ms, dan lonjakan penggunaan CPU/panas pada Linux.
   - Frontend hanya mengirim perintah asinkron ringan (`audio_play`) tanpa `await` (*fire-and-forget* <0.01ms overhead).

2. **Zero Allocation & Lock-Free pada Hot Path Audio**:
   Pada thread callback audio Rust (`audio/device.rs` dan `audio/mixer.rs`):
   - DILARANG melakukan alokasi memori heap (`Vec`, `Box`, `String`) di dalam render loop audio.
   - DILARANG melakukan blocking I/O, syscall, logging, atau lock blocking. Gunakan `try_lock()` dan non-blocking atomic / SPSC queue channel.
   - Mixer menggunakan pool 64 suara pre-dialokasikan dengan polyphonic scaling dan limiter rational soft-clip untuk mencegah distorsi pada pengetikan kecepatan tinggi (150+ WPM).

3. **DILARANG `await` di Jalur Panas Pengetikan (*Hot Path*)**:
   Pemanggilan `soundController.playClick(keyCode)` dan `engine.play(id)` wajib sinkron *fire-and-forget*. Dilarang menempatkan `await` atau operasi asynchronous blocking pada event `handleKeyInput` di `TypingArena.svelte`.

4. **DILARANG Membuat `new AudioContext()` di Luar `audio-context-provider.ts`**:
   Semua modul web audio fallback (`zzfx.ts`, `sound-engine.ts`, `menu-sfx.ts`) wajib menggunakan `getSharedAudioContext()` dari `audio-context-provider.ts`. Dilarang meneruskan opsi `{ latencyHint: 'interactive' }` pada instansiasi `AudioContext` karena memicu kegagalan alokasi buffer Bluetooth A2DP di Linux WebKitGTK yang menyebabkan keheningan total (*silent failure*).

5. **DILARANG Keep-Alive Bernilai Nol (*Digital Silence*) & Zero-Lag Buffer**:
   Carrier keep-alive wajib menghasilkan sinyal dither aktif nyata (TPDF noise ~ -88 dBFS / ±1.5 LSB 16-bit). Nilai nol murni (`ConstantSource(0)` atau buffer kosong) akan terkuantisasi menjadi keheningan total oleh DSP speaker Bluetooth/DAC, memicu sleep-standby yang memotong keystroke click berikutnya. Pada backend native Rust (`audio/mixer.rs`), dither TPDF dibangkitkan secara lock-free zero-allocation selama 30 detik setelah setiap ketukan tombol dan pre-warmed pada startup. Dilarang mengganti dither dengan keheningan mutlak `0.0`.
   Konfigurasi buffer stream CPAL wajib menggunakan buffer ketat berlatensi rendah (`BufferSize::Fixed(256.clamp(min, max))`) alih-alih `BufferSize::Default` untuk mengeliminasi lag/delay buffer 100-200ms pada Bluetooth A2DP / sound servers.

6. **Isolasi `TypingArena.svelte` & Controller Inti**:
   Modifikasi suara dilarang mengubah signature `typing-arena.controller.svelte.ts` atau merombak state machine pengetikan.

7. **Resiliensi Perangkat Keras, Bluetooth A2DP, Anti-Dropout & Event-Driven Hot Swapping 2-Arah**:
   Backend Rust CPAL wajib mempertahankan supervisor loop dinamis di `audio/device.rs` dengan instant wake-up channel (`rebuild_rx.recv_timeout(500ms)`).
   - Hot Swapping 2-Arah (Speaker Internal ⇄ Speaker Eksternal Bluetooth): Pada sound server modern (PulseAudio / PipeWire), `host.default_output_device()` adalah *Golden Source of Truth*. Ketika pengguna mengubah default output di OS, supervisor mendeteksi perubahan nama perangkat dan secara instan memigrasikan stream tanpa perlu restart/reload aplikasi.
   - Event-Driven Instant Wake-Up (<0.1ms): Perintah Tauri `audio_rebuild_stream` diikatkan ke watcher multi-event `setupDeviceChangeWatcher` di webview (`devicechange`, window `focus`, and document `visibilitychange`), membangunkan supervisor loop seketika saat pengguna mengubah pengaturan audio di panel desktop OS lalu kembali ke aplikasi.
   - Anti-Dropout Stability: Transient buffer underrun/xrun pada transmisi radio Bluetooth DILARANG merobohkan (*teardown*) active stream. Stream hanya di-rebuild saat terjadi diskoneksi fatal (`DeviceNotAvailable`, `StreamInvalidated`), saat device name berubah, atau sinyal `rebuild_requested`.
   - Supervisor loop dan fungsi resolusi perangkat DILARANG melakukan enumerasi berat `host.output_devices()` yang memicu probing slave hardware ALSA (`pcm_dmix.c unable to open slave`). Resolusi rute wajib murni mengueri `host.default_output_device()`.
   - Thread audio runner wajib mengeksekusi `silence_alsa_logging()` via `snd_lib_error_set_handler` untuk membungkam diagnostik internal ALSA C ke stderr.
   - Sampel audio kanonikal di `raw_samples` di-resample ulang secara otomatis ke rate perangkat baru via `resample_stereo`. DILARANG mengunci stream ke satu thread block `recv()` statis permanen.

8. **Rentang Volume Ekstra [0.0, 2.0] & Proteksi Soft-Clipping (0–200%)**:
   - Seluruh pipeline audio (UI Slider `SoundSettingsSection.svelte`, `settings.store.svelte.ts`, `native-sound-engine.ts`, `sound-engine.ts`, `adaptive-sound-engine.ts`, hingga backend Rust `audio/mixer.rs`) mendukung rentang volume `0.0` sampai `2.0` (200% boost).
   - Penguatan volume hingga $2.0\times$ (+6 dB) diproteksi secara matematis di level backend Rust mixer menggunakan analog-style rational saturation:
     $$\text{soft\_clip}(x) = \frac{x}{1.0 + |x|} \cdot 1.5 \quad (\text{clamped to } [-1.0, 1.0])$$
   - Formula ini menjamin amplifikasi volume 200% terdengar jelas, punchy, dan bertenaga tanpa pernah mengalami digital harsh clipping, crackle, atau wrap-around overflow. DILARANG menurunkan batas atas volume ke 1.0 kembali di modul apa pun.
