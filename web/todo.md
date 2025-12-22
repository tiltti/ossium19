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

### fm4op Debug Logging
- `fm4op-engine.ts` has extensive debugging code
- This appears to be older/unused code (4-op vs 6-op FM)
- **Fix:** Remove or clean up if not needed

## Completed

- [x] Mixer pan controls connected to audio (StereoPannerNode in all engines)
- [x] OSSIAN SPACE reverb connected to all audio engines (synth, fm6op, drums)
- [x] SYX preset loading - clicking loads into FM synth and switches tab
- [x] Console.log cleanup in production stores and engines
- [x] Responsive spectrum display (no more empty space on right)
- [x] Page title updated to OSSIAN-19
