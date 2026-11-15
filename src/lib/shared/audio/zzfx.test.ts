import { describe, it, expect, beforeEach } from "vitest";
import {
  zzfxG,
  zzfxMComposite,
  createAudioBufferFromSamples,
  clearAudioBufferCache,
  bakeZzFXComposite,
  playZzFXComposite,
  samplesToWavBlob,
  warmAudioContext,
  getCachedAudioBuffer,
  startAudioKeepAlive,
  stopAudioKeepAlive,
  unlockAudioContext,
  zzfx,
  ZZFX,
  ZZFXSound,
  type ZzFXSoundParams,
} from "./zzfx";

describe("zzfx audio engine", () => {
  beforeEach(() => {
    clearAudioBufferCache();
  });

  it("zzfxG synthesizes raw audio samples within [-1, 1] using numbers or array", () => {
    // Number arguments
    const samples = zzfxG(0.8, 0, 440, 0.005, 0.01, 0.04, 0, 1, -1, 0, 0, 0, 0, 0.1);
    expect(samples).toBeInstanceOf(Float32Array);
    expect(samples.length).toBeGreaterThan(0);

    // Array argument signature with 48000Hz (Bluetooth / USB DAC)
    const arraySamples = zzfxG([0.8, 0, 440, 0.005, 0.01, 0.04, 0, 1, -1, 0, 0, 0, 0, 0.1], 48000);
    expect(arraySamples).toBeInstanceOf(Float32Array);
    expect(arraySamples.length).toBeGreaterThan(0);

    // Verify all samples are within valid audio dynamic range
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-1);
      expect(samples[i]).toBeLessThanOrEqual(1);
    }
  });

  it("zzfxG handles ADSR envelope, pitch jumps, tremolo, and noise without sampleRate injection", () => {
    const samples = zzfxG(
      0.5, // volume
      0, // randomness
      800, // freq
      0.01, // attack
      0.02, // sustain
      0.03, // release
      2, // saw
      1.5, // curve
      -5, // slide
      0.1, // delta slide
      100, // pitch jump
      0.01, // pitch jump time
      0, // repeat
      0.2, // noise
      10, // mod
      2, // bitcrush
      0.01, // delay
      0.8, // sustain vol
      0.01, // decay
      0.3, // tremolo
    );
    expect(samples.length).toBeGreaterThan(0);
    expect(samples[0]).toBeDefined();
  });

  it("zzfxMComposite combines multiple layers with soft saturation", () => {
    const layer1: ZzFXSoundParams = [0.4, 0, 600, 0.002, 0.01, 0.02, 0];
    const layer2: ZzFXSoundParams = [0.5, 0, 180, 0.001, 0.02, 0.05, 1];
    const composite = zzfxMComposite([layer1, layer2]);

    expect(composite).toBeInstanceOf(Float32Array);
    expect(composite.length).toBeGreaterThan(0);

    for (let i = 0; i < composite.length; i++) {
      expect(composite[i]).toBeGreaterThanOrEqual(-1);
      expect(composite[i]).toBeLessThanOrEqual(1);
    }
  });

  it("zzfxMComposite returns empty array if no layers provided", () => {
    const composite = zzfxMComposite([]);
    expect(composite.length).toBe(0);
  });

  it("createAudioBufferFromSamples and bakeZzFXComposite handle test environment safely", () => {
    const samples = new Float32Array([0, 0.5, -0.5, 0]);
    const buffer = createAudioBufferFromSamples(samples, null);
    expect(buffer === null || typeof buffer === "object").toBe(true);

    const baked = bakeZzFXComposite("test-key", [[0.5, 0, 440]]);
    expect(baked === null || typeof baked === "object").toBe(true);

    expect(getCachedAudioBuffer("non-existent")).toBeUndefined();
  });

  it("warmAudioContext executes safely without errors", () => {
    expect(() => warmAudioContext()).not.toThrow();
  });

  it("manages hardware audio keep-alive carrier node safely", () => {
    expect(() => startAudioKeepAlive()).not.toThrow();
    expect(() => stopAudioKeepAlive()).not.toThrow();
  });

  it("unlockAudioContext returns active context", async () => {
    const ctx = await unlockAudioContext();
    expect(ctx).toBeDefined();
  });

  it("exports official KilledByAPixel/ZzFX primitives", () => {
    expect(typeof zzfx).toBe("function");
    expect(ZZFX).toBeDefined();
    expect(typeof ZZFX.buildSamples).toBe("function");
    expect(typeof ZZFX.playSamples).toBe("function");
    expect(typeof ZZFXSound).toBe("function");
  });

  it("samplesToWavBlob encodes valid 16-bit PCM stereo WAV Blob", async () => {
    const samples = new Float32Array([0, 0.5, -0.5, 0.8, -0.8]);
    const blob = samplesToWavBlob(samples, 44100);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("audio/wav");
    // Header (44) + 5 samples * 2 channels * 2 bytes = 44 + 20 = 64 bytes
    expect(blob.size).toBe(64);

    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);
    // Check "RIFF" and "WAVE" magic bytes
    expect(view.getUint32(0, false)).toBe(0x52494646);
    expect(view.getUint32(8, false)).toBe(0x57415645);
  });

  it("playZzFXComposite synthesizes and plays safely without errors", () => {
    expect(() => {
      playZzFXComposite("test-click", [[0.4, 0, 440, 0.01, 0.02, 0.03]]);
    }).not.toThrow();
  });
});
