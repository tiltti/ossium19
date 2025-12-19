# Ossian-19 Synthesizer - Käyttöopas

## Yleiskatsaus

Ossian-19 on hybridisyntetisaattori, joka yhdistää klassisen subtraktiivisen synteesin FM-synteesiin (taajuusmodulaatio). Tämä mahdollistaa laajan skaalan ääniä yhdestä moottorista.

### Tekniset tiedot

- **Polyfonia**: 8 ääntä (voice stealing)
- **Näytteenottotaajuus**: Selaimesta riippuva (yleensä 44100 Hz tai 48000 Hz)
- **DSP-moottori**: Rust/WebAssembly
- **Synteesinä**: Subtraktiivinen + 4-operaattori FM

## Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────┐
│                         VOICE                               │
│                                                             │
│  ┌─────────┐     FM modulation      ┌─────────┐            │
│  │  OSC 2  │ ──────────────────────>│  OSC 1  │            │
│  │(modulat)│    (when FM > 0)       │(carrier)│            │
│  └────┬────┘                        └────┬────┘            │
│       │                                  │                  │
│       │ (mix when FM = 0)                │                  │
│       └──────────────┬───────────────────┘                  │
│                      │                                      │
│  ┌─────────┐         │         ┌─────────┐                 │
│  │ SUB OSC │─────────┼─────────│  NOISE  │                 │
│  │(oct low)│         │         │  (white)│                 │
│  └─────────┘         │         └─────────┘                 │
│                      ▼                                      │
│              ┌───────────────┐                             │
│              │    MIXER      │                             │
│              └───────┬───────┘                             │
│                      ▼                                      │
│              ┌───────────────┐      ┌──────────┐           │
│              │ LADDER FILTER │<─────│FILTER ENV│           │
│              │   (Moog-style)│      └──────────┘           │
│              └───────┬───────┘                             │
│                      ▼                                      │
│              ┌───────────────┐      ┌──────────┐           │
│              │      VCA      │<─────│  AMP ENV │           │
│              └───────┬───────┘      └──────────┘           │
│                      ▼                                      │
│                   OUTPUT                                    │
└─────────────────────────────────────────────────────────────┘
```

## Synteesimoodit

### 1. Subtraktiivinen synteesi (FM Amount = 0)

Klassinen analogisynteesin tyyli:
- **OSC 1 & 2** tuottavat aaltomuotoja (sini, saha, neliö, kolmio)
- Oskillaattorit **sekoitetaan yhteen** additiivisesti
- **Filter** muokkaa harmonista sisältöä
- **Envelopes** kontrolloivat äänenvoimakkuutta ja filteriä

**Käyttö:**
- Pidä FM Amount = 0
- Säädä OSC 1 ja OSC 2 waveformit ja levelit
- OSC 2 Detune luo paksuutta (chorus-efekti)

### 2. FM-synteesi (FM Amount > 0)

Digitaalinen FM-synteesi (DX7-tyylinen):
- **OSC 2 = Modulator** - tuottaa modulointisignaalin
- **OSC 1 = Carrier** - tuottaa kuultavan äänen
- Modulaattori **muuttaa kantajan vaihetta** → syntyy uusia harmonisia

**Miksi OSC 2 → OSC 1?**

FM-synteesissä tarvitaan kaksi oskillaattoria eri rooleissa:
1. **Carrier (kantaja)** - tämän taajuus määrää nuotin sävelkorkeuden
2. **Modulator (modulaattori)** - tämän signaali "heiluttaa" kantajan taajuutta

Kun modulaattori moduloi kantajaa, syntyy **sivukaistoja** (sidebands) - uusia taajuuksia jotka luovat monimutkaisia harmonisia. Tämä on täysin eri mekanismi kuin subtraktiivinen synteesi.

**FM-parametrit:**

| Parametri | Kuvaus | Tyypilliset arvot |
|-----------|--------|-------------------|
| FM Amount | Modulaation voimakkuus | 0.0-1.0 |
| FM Ratio  | Modulaattorin taajuussuhde | 0.25-8.0 |

**FM Ratio -arvot:**

- **1:1** (ratio=1.0) - Paksu, harmoninen ääni (bassot)
- **2:1** (ratio=2.0) - Klassinen FM EP-piano
- **3:1** (ratio=3.0) - Kirkkaampi, harmoniset ylä-äänet
- **3.5:1, 7:1** - Epäharmoniset kellot ja metallinen sointi
- **0.5:1** (ratio=0.5) - Subharmoniset, syvät äänet

## 4-Operaattori FM -synteesi (4-OP FM)

Ossian-19 sisältää erillisen 4-operaattori FM-syntetisaattorin, joka on inspiroitu klassisista DX7-tyylisistä FM-syntikoista.

### Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────────┐
│                     4-OPERATOR FM VOICE                         │
│                                                                 │
│  ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐                        │
│  │ OP4 │   │ OP3 │   │ OP2 │   │ OP1 │  ← Jokaisella oma ADSR  │
│  │     │   │     │   │     │   │     │                         │
│  └──┬──┘   └──┬──┘   └──┬──┘   └──┬──┘                        │
│     │         │         │         │                            │
│     └─────────┴─────────┴─────────┘                            │
│                    │                                            │
│            ┌───────▼────────┐                                  │
│            │   ALGORITHM    │  ← 8 eri reititysalgoritmia       │
│            │  (reititys)    │                                   │
│            └───────┬────────┘                                  │
│                    ▼                                            │
│               OUTPUT                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Algoritmit

| Algo | Nimi | Rakenne | Käyttö |
|------|------|---------|--------|
| 1 | Serial | 4→3→2→1 | Maksimi modulaatio, metallinen |
| 2 | Branch | (4+3)→2→1 | Monipuolinen, paksu FM |
| 3 | Two Stacks | 4→3, 2→1 | Kaksi erillistä FM-paria |
| 4 | Three-to-One | 4,3,2→1 | Kolme modulaattoria |
| 5 | Mixed | 4→3, 2, 1 | FM + additiivinen |
| 6 | One-to-Three | 4→(3,2,1) | Yksi modulaattori, kolme kantajaa |
| 7 | Parallel | 4→3, 2, 1 | FM-pari + kaksi puhdasta |
| 8 | Additive | 4, 3, 2, 1 | Kaikki kantajia (orgeli) |

### Operaattorin parametrit

| Parametri | Kuvaus | Arvo |
|-----------|--------|------|
| **Ratio** | Taajuussuhde perustaajuuteen | 0.5-8.0 |
| **Level** | Operaattorin voimakkuus | 0.0-1.0 |
| **Detune** | Hienoviritys (centit) | -100...+100 |
| **Attack** | Verhokäyrän nousu | 0.001-2.0s |
| **Decay** | Verhokäyrän lasku | 0.001-3.0s |
| **Sustain** | Pidetty taso | 0.0-1.0 |
| **Release** | Vapautusaika | 0.01-5.0s |
| **Feedback** | Itsemodulaatio | 0.0-1.0 |

### Carrier vs Modulator

- **Carrier (kantaja)**: Tuottaa kuultavan äänen - tason tulee olla > 0
- **Modulator (modulaattori)**: Moduloi kantajaa - tason nosto lisää harmonisia

Algoritmissa kantajat ovat viimeiset operaattorit ketjussa. Esim. algoritmi 1 (Serial): OP4→OP3→OP2→OP1, missä OP1 on ainoa kantaja.

### 4-Op FM Preset-kategoriat

| Kategoria | Kuvaus |
|-----------|--------|
| **Basic** | Perus-äänet ja lähtökohdat |
| **Keys** | Sähköpianot, clavit |
| **Bass** | FM-bassot |
| **Bells** | Kellot ja metallinen |
| **Brass** | Puhaltimet |
| **Pad** | Tekstuurit ja atmosfäärit |
| **Mallet** | Marimba, vibraphone |
| **Organ** | Urkuäänet |
| **Pluck** | Näppäilyt |
| **Lead** | Melodiaäänet |

## Äänilähteet

### Oskillaattorit (OSC 1 & OSC 2)

| Aaltomuoto | Karakteri | Käyttö |
|------------|-----------|--------|
| **Sine** | Puhdas, ei harmonisia | FM, subbassi, orgeli |
| **Saw** | Kaikki harmoniset | Leadit, padit, klassinen analoginen |
| **Square** | Parittomat harmoniset | Ontto sointi, puu-henkiset |
| **Triangle** | Vähän harmonisia | Pehmeä, flute-tyyppinen |

### Sub-oskillaattori

- Oktaavi OSC 1:n alapuolella
- Neliöaalto (klassinen Moog-sub)
- Lisää syvyyttä ja pohjaa

### Kohina (Noise)

- Valkoinen kohina
- Perkussiiviset äänet, tuuli, tekstuuri
- Yhdistetään usein filter sweeppiin

## Suodatin (Filter)

24dB/oktaavi Moog-tyylinen ladder filter:

- **Cutoff**: Rajataajuus (20-20000 Hz)
- **Resonance**: Korostus rajataajuudella (0-1)
- **Env Amount**: Kuinka paljon filter envelope vaikuttaa cutoffiin

**Vinkkejä:**
- Korkea resonanssi + matala cutoff = "wow" efekti
- Filter env + nopea decay = pluck-äänet
- Alhainen cutoff subtraktiivisessa = lämmin, analoginen

## Verhokäyrät (Envelopes)

ADSR-verhokäyrät:

| Vaihe | Kuvaus |
|-------|--------|
| **Attack** | Kuinka nopeasti ääni nousee maksimiin |
| **Decay** | Kuinka nopeasti laskee sustain-tasolle |
| **Sustain** | Taso kun nuottia pidetään pohjassa |
| **Release** | Kuinka nopeasti häviää nuotin päästämisen jälkeen |

## Preset-kategoriat (Subtraktiivinen)

| Kategoria | Kuvaus |
|-----------|--------|
| **Basic** | Lähtöpiste, oletus-äänet |
| **Bass** | Bassot - Moog, sub |
| **Lead** | Soolomelodia-äänet |
| **Pad** | Pitkät, tunnelmalliset tekstuurit |
| **Pluck** | Näppäilyt, pianot |
| **Keys** | Kosketinsoittimet |
| **FX** | Erikoisefektit, kohinat |

## Efektit

- **Reverb**: Tilan simulointi (Mix, Decay)
- **Delay**: Viive/kaiku (Time, Feedback, Mix)
- **Chorus**: Paksuus ja liike (Rate, Depth, Mix)

## Pikanäppäimet

Koskettimisto simuloi pianonäppäimiä:
- Valkoinen rivi: C, D, E, F, G, A, B
- Musta rivi: C#, D#, F#, G#, A#

## Esimerkkejä

### Klassinen Moog-basso
1. OSC 1: Saw, Level 1.0
2. OSC 2: Saw, Detune +5, Level 0.6
3. Sub: 0.7
4. Filter: Cutoff 300, Reso 0.5, Env 0.6
5. Amp Env: A 0.001, D 0.2, S 0.5, R 0.15

### FM Kello
1. OSC 1: Sine, Level 1.0
2. FM Amount: 0.7
3. FM Ratio: 3.5 (epäharmoninen)
4. Amp Env: A 0.001, D 1.5, S 0.0, R 1.0
5. Reverb Mix: 0.5

### DX7-tyylinen EP
1. OSC 1: Sine, Level 1.0
2. FM Amount: 0.4
3. FM Ratio: 2.0
4. Amp Env: A 0.001, D 0.6, S 0.4, R 0.4
5. Chorus Mix: 0.25

---

*Ossian-19 - Rust/WASM Software Synthesizer*
