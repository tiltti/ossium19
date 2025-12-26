# OSSIAN-19 TODO

## Future Features

### Audio Unit Plugin (Logic Pro)
Convert OSSIAN-19 to native AU plugin using nih-plug:
- [ ] Extract synth-core to separate Rust crate (no WASM bindings)
- [ ] Add nih-plug dependency and implement Plugin trait
- [ ] Create native UI (egui or iced)
- [ ] Build AU/VST3/CLAP bundle
- [ ] Test in Logic Pro

## Known Issues

### Deprecated ScriptProcessorNode
- Used in `fm6op-engine.ts` and `engine.ts`
- Should be migrated to AudioWorklet for better performance
- **Fix:** Refactor to use AudioWorkletNode with custom processor

### Unused fm4op Code
- fm4op (4-operator FM) has been replaced by fm6op (6-operator)
- Fm4OpPanel is not imported anywhere - entire fm4op codebase is dead code
- Files to remove: fm4op-engine.ts, fm4op-store.ts, fm4op-presets.ts, fm4op-types.ts, Fm4OpPanel.tsx
- **Fix:** Delete all fm4op files if confirmed unused

## Needs Testing

- [ ] **MIDI Input** - Web MIDI API integration (velocity, pitch bend, mod wheel, GM drums)
  - Test with hardware MIDI controller
  - Verify note on/off with velocity
  - Test pitch bend spring-return
  - Test mod wheel routing (filter/vibrato)
  - Test drum GM mapping

## Completed

- [x] MIDI input implementation (untested with hardware)
- [x] Mod wheel / pitch bender UI redesign with LED indicators
- [x] fm4op debug logging cleaned up
- [x] Mixer pan controls connected to audio (StereoPannerNode in all engines)
- [x] OSSIAN SPACE reverb connected to all audio engines (synth, fm6op, drums)
- [x] SYX preset loading - clicking loads into FM synth and switches tab
- [x] Console.log cleanup in production stores and engines
- [x] Responsive spectrum display (no more empty space on right)
- [x] Page title updated to OSSIAN-19
