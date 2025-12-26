# OSSIAN-19 TODO

## Future Features

### Audio Unit Plugin (Logic Pro)
Convert OSSIAN-19 to native AU plugin using nih-plug:
- [ ] Extract synth-core to separate Rust crate (no WASM bindings)
- [ ] Add nih-plug dependency and implement Plugin trait
- [ ] Create native UI (egui or iced)
- [ ] Build AU/VST3/CLAP bundle
- [ ] Test in Logic Pro

## Needs Testing

- [ ] **MIDI Input** - Web MIDI API integration (velocity, pitch bend, mod wheel, GM drums)
  - Test with hardware MIDI controller
  - Verify note on/off with velocity
  - Test pitch bend spring-return
  - Test mod wheel routing (filter/vibrato)
  - Test drum GM mapping

## Completed

- [x] AudioWorklet migration (engine.ts, fm6op-engine.ts) - replaced deprecated ScriptProcessorNode
- [x] fm4op dead code removal - replaced by 6-operator FM (fm6op)
- [x] MIDI input implementation (untested with hardware)
- [x] Mod wheel / pitch bender UI redesign with LED indicators
- [x] fm4op debug logging cleaned up
- [x] Mixer pan controls connected to audio (StereoPannerNode in all engines)
- [x] OSSIAN SPACE reverb connected to all audio engines (synth, fm6op, drums)
- [x] SYX preset loading - clicking loads into FM synth and switches tab
- [x] Console.log cleanup in production stores and engines
- [x] Responsive spectrum display (no more empty space on right)
- [x] Page title updated to OSSIAN-19
