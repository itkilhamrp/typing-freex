# 🏆 Typing FreeX — Personal Best Evolution Tier System

Dokumentasi resmi arsitektur dan tabel ambang batas (**Minimum Requirements**) untuk sistem tingkatan **Personal Best Evolution Tier (Tier 0 hingga 10)** pada Typing FreeX.

Sistem ini dirancang untuk memberikan rasa pencapaian (*sense of progression & mastery*) yang bermakna, menantang, dan prestisius bagi pengetik dari berbagai level keahlian. Dimulai dari **Tier 0** sebagai tingkatan dasar (*Unranked / Novice Base*), pengetik harus berjuang memenuhi ambang batas kecepatan dan akurasi nyata untuk menembus **Tier 1** dan seterusnya hingga mahkota tertinggi **Tier 10**.

Setiap tier merepresentasikan evolusi profil keycap mekanikal legendaris, geometri kartu kristal asimetris, dan profil akustik switch prosedural unik.

---

## 🧭 Filosofi & Aturan Umum Progresi

1. **Titik Awal Dimulai dari Tier 0 (Unranked Base)**:
   - Pengetik pemula atau hasil sesi yang belum memenuhi ambang batas minimum Tier 1 berada pada **Tier 0**.
   - Pada **Tier 0**, kartu tampil dengan permukaan kaca utuh mulus tanpa retakan dan bingkai bersih tanpa tanduk kristal yang menonjol.
2. **Tier 1 Memiliki Minimum Requirements Nyata**:
   - Naik ke **Tier 1** memerlukan pencapaian awal yang nyata:
     - **Mode Normal**: WPM $\ge$ 30 dan Akurasi $\ge$ 80.0%.
     - **Mode Expert**: WPM $\ge$ 40 dan Akurasi $\ge$ 85.0%.
     - **Mode Master**: WPM $\ge$ 40 dan Akurasi 100% mutlak.
   - Membuka Tier 1 memicu erupsi tunas kristal pertama pada bingkai kartu dan retakan mikro pertama pada kaca pelindung.
3. **Keseimbangan Kecepatan & Disiplin Akurasi**:
   - **Mode Normal**: Menguji keseimbangan kecepatan WPM dan akurasi umum ($\ge$ 80% hingga 99%).
   - **Mode Expert**: Menuntut disiplin akurasi ketat ($\ge$ 85% hingga 99.5%) dengan penalti kesalahan tinggi.
   - **Mode Master**: Mode *Sudden Death* di mana akurasi **wajib 100% mutlak** (satu kesalahan langsung menggagalkan tes), sehingga progresi murni ditentukan oleh batas kecepatan WPM ekstrem (40 hingga 220+ WPM).
4. **Pemberian Tier Bersifat Deterministik**:
   - Sistem mengevaluasi record personal best dan memberikan tier tertinggi yang seluruh syarat batasnya (WPM dan Akurasi) terpenuhi secara matematis.

---

## 🟢 1. Mode Normal (Balanced / General Typing)

Mode seimbang untuk pengetik harian dan penggemar keyboard mekanikal. Membutuhkan peningkatan ritme ketik bertahap dari pemula (Tier 0) hingga grandmaster (Tier 10).

| Tier | Nama Keycap | Profil Keyboard | Min. WPM | Min. Akurasi | Karakter Visual & Kristal | Profil Akustik Prosedural |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **0** | **Stock Membrane Flat** | Membrane Standard | **0** | **0%** | Slate netral, kaca utuh, tanpa kristal luar | Muffled rubber dome squish (800 Hz) + soft bottom |
| **1** | **ABS OEM Classic** | OEM ABS Standard | **30** | **80.0%** | Slate cyan, tunas kristal awal muncul | Snap ABS ringan (2.6 kHz) + bottom-out berongga |
| **2** | **Cherry PBT Minimal** | Cherry PBT Dense | **45** | **85.0%** | Deep Teal, aksen mint halus | PBT leaf snap (2.8 kHz) + thock padat (380 Hz) |
| **3** | **DSA Workstation** | DSA Uniform Flat | **60** | **88.0%** | Slate cyan, border teal tegas | Kontak flat spherical (2.4 kHz) + pitch rendah |
| **4** | **XDA Canvas** | XDA Broad Dish | **75** | **90.0%** | Cerulean teal, specular rim | Dish lebar beresonansi + crisp snap (2.6 kHz) |
| **5** | **KAT Drift** | KAT Smooth Sculpt | **90** | **92.0%** | Ocean gloss, white accent | Smooth glide clack + clean bottom-out (360 Hz) |
| **6** | **OEM Pudding Dual** | PUDDING DUAL | **105** | **94.0%** | Translucent dual-layer teal | Diffuse polycarbonate pop + acoustic crisp clack |
| **7** | **KAM Ocean Satin** | KAM SATIN GLOSS | **120** | **96.0%** | Satin teal geode, sharp cuts | Deep oceanic thock + satin contact ring |
| **8** | **Botanical Dye-Sub** | BOTANICAL PBT | **135** | **97.0%** | Emerald forest, mint facets | Ultra-dense PBT bottom-out (320 Hz) + leafy snap |
| **9** | **Glazed Cyan Ceramic** | CERAKEY CYAN | **150** | **98.0%** | Glazed ceramic gloss, halo | Chime porselen jernih (2.1 kHz) + ceramic thud |
| **10** | **CNC Anodized Teal** | 6063 CNC TEAL | **165** | **99.0%** | Apex Teal Crown, gold rim | Rigid alloy chassis bottom-out + titanium ring |

---

## 🟡 2. Mode Expert (High Precision & Strict Penalty)

Mode kompetitif yang menuntut presisi tinggi. Kecepatan tinggi tanpa akurasi tinggi tidak akan dapat membuka tier atas.

| Tier | Nama Keycap | Profil Keyboard | Min. WPM | Min. Akurasi | Karakter Visual & Kristal | Profil Akustik Prosedural |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **0** | **Generic Amber ABS** | Loose Stock ABS | **0** | **0%** | Amber gelap muted, kaca utuh mulus | Loose hollow ABS plastic rattle (1.8 kHz) |
| **1** | **DSA Granite Classic** | DSA DENSE PBT | **40** | **85.0%** | Bronze amber muted, tanduk kristal awal | Tactile bump halus (2.4 kHz) + matte bottom-out |
| **2** | **XDA Milestone Amber** | XDA WARM PBT | **55** | **90.0%** | Warm amber, bronze bevel | Warm PBT actuation + hollow cavity thock |
| **3** | **KAT Refined Copper** | KAT METALLIC | **70** | **92.0%** | Copper luster, gold rail | Metallic leaf click (2.8 kHz) + dense copper thud |
| **4** | **OEM Cyberpunk Amber** | OEM HIGH-PROFILE | **85** | **94.0%** | Cyber amber, neon facets | High-tension switch clack (3.2 kHz) + heavy housing |
| **5** | **KAM Sunset Gloss** | KAM SMOOTH GLOSS | **100** | **95.0%** | Golden sunset, specular | Ultra-smooth switch slide + bottom-out resonate |
| **6** | **PC Frosted Amber** | PC SMOKE AMBER | **115** | **96.0%** | Frosted crystal facets | Polycarbonate crisp pop (3.4 kHz) + amber refraction |
| **7** | **Machined Brass Artisan** | SOLID BRASS CNC | **130** | **97.0%** | Solid brass relief, shimmer | High-mass metallic clink (1.9 kHz) + heavy chassis |
| **8** | **Amber Honeycomb Lattice** | SKELETON HEX | **145** | **98.0%** | Hexagonal skeletal geode | Open acoustic resonance buzz + precision leaf snap |
| **9** | **Golden Enamel Relief** | ENAMEL 24K GOLD | **160** | **99.0%** | Imperial gold enamel, halo | Porcelain edge strike (3.0 kHz) + golden chime |
| **10** | **Forged Carbon & 24K Gold** | FORGED CARBON | **175** | **99.5%** | Apex Forged Gold Carbon | Pure acoustic carbon damp (180 Hz) + 24K gold chime |

---

## 🔴 3. Mode Master (Sudden Death / 100% Accuracy Only)

Mode dewa pengetik elit. Akurasi **100% mutlak** adalah syarat mutlak sistem: satu kesalahan ketik langsung mengakhiri tes. Progresi diukur murni dari kecepatan WPM murni di bawah tekanan ekstrem.

| Tier | Nama Keycap | Profil Keyboard | Min. WPM | Min. Akurasi | Karakter Visual & Kristal | Profil Akustik Prosedural |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **0** | **Unranked Bare Red Stem** | Bare Cherry Red Stem | **0** | **100%** | Crimson pekat muted, kaca magma utuh | Raw unmounted switch stem click (2.1 kHz) |
| **1** | **Cherry Red Samurai** | CHERRY PBT RED | **40** | **100%** | Crimson samurai, gold rim, kristal awal | Katana leaf snap (2.8 kHz) + samurai blade harmonic |
| **2** | **SA Berserk Crimson** | SA SPHERICAL TALL | **60** | **100%** | Deep berserk red facets | Cavernous hollow SA thock (140 Hz) + tall housing |
| **3** | **MT3 Obsidian Scoop** | MT3 DEEP-DISH | **80** | **100%** | Deep dish obsidian, ruby | Sub-bass scoop thock (105 Hz) + dense damping |
| **4** | **Ruby Polycarbonate** | PC TRANSLUCENT | **100** | **100%** | Translucent ruby crystal | High-frequency crystal snap (3.4 kHz) + clack |
| **5** | **Crimson Glazed Ceramic** | CERAKEY GLOSS | **120** | **100%** | Crimson ceramic glaze | Pristine porcelain chime (2.1 kHz) + ceramic thud |
| **6** | **Aerospace CNC Aluminum** | 6063 CNC ALLOY | **140** | **100%** | CNC aerospace alloy red | Rigid CNC chassis contact (3.1 kHz) + metallic ring |
| **7** | **Damascus Steel Forged** | DAMASCUS STEEL | **160** | **100%** | Wavy pattern forged steel | Forged steel strike (2.6 kHz) + sword blade clink |
| **8** | **Ruby Crystal Geode** | MINERAL CRYSTAL | **180** | **100%** | Raw mineral crystal facet | Dual-harmonic crystal sparkle (2.4 kHz) + geode thud |
| **9** | **Meteorite Magma Vein** | WIDMANSTÄTTEN | **200** | **100%** | Celestial Widmanstätten | Seismic deep planetary impact thock (92 Hz) + buzz |
| **10** | **Apex Transcendence Crown** | TITANIUM CROWN | **220** | **100%** | Supreme Royal Crown | Laser-crisp titanium snap (3.8 kHz) + crown chime |

---

## 🛠️ Implementasi Teknis & Arsitektur Kode

Sistem tier diimplementasikan secara bersih dan modular:

1. **Mesin Kalkulasi**:
   - Terletak pada modul independen: [`src/lib/modules/analytics/utils/evolution-tier.ts`](src/lib/modules/analytics/utils/evolution-tier.ts).
   - Fungsi utama: `getEvolutionTier(difficulty, wpm, accuracy): number` (mengembalikan integer 0 hingga 10).
   - Fungsi pendukung: `getTierThreshold(difficulty, tier): TierThreshold` (men-clamp input 0 hingga 10).
2. **Pengujian Otomatis**:
   - Seluruh batasan diuji secara ketat pada: [`src/lib/modules/analytics/utils/evolution-tier.test.ts`](src/lib/modules/analytics/utils/evolution-tier.test.ts).
3. **Penyajian UI/UX**:
   - Dipetakan secara dinamis pada kartu Personal Best di: [`src/lib/modules/analytics/components/AnalyticsView.svelte`](src/lib/modules/analytics/components/AnalyticsView.svelte).
   - Menghubungkan visual siluet asimetris kartu ([`CardCrystalAccents.svelte`](src/lib/modules/analytics/components/CardCrystalAccents.svelte)), retakan kaca dinamis ([`CardGlassCracks.svelte`](src/lib/modules/analytics/components/CardGlassCracks.svelte)), dan keycap 3D interaktif ([`KeycapEvolutionBadge.svelte`](src/lib/modules/analytics/components/KeycapEvolutionBadge.svelte)).
4. **Akustik Prosedural**:
   - Setiap tier membunyikan suara mechanical switch nyata yang disintesis secara offline via ZzFX resmi Frank Force: [`src/lib/modules/analytics/utils/keycap-acoustic-presets.ts`](src/lib/modules/analytics/utils/keycap-acoustic-presets.ts).
