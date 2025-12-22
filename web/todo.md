# OSSIAN-19 TODO

## Known Issues

### OSSIAN SPACE Reverb Not Connected
- The SpaceFxPanel UI and store exist and work
- But the SpaceReverb audio class is never instantiated or connected to the audio chain
- The store's `subscribeToChanges` is never called by any audio engine
- **Fix:** Create SpaceReverb instance in audio engines and subscribe to store changes

### Mixer Pan Controls Not Connected
- Pan knobs work and store state in MixerPanel
- But pan values are never applied to the audio routing
- Only volume/mute/solo affect the actual audio output
- **Fix:** Add StereoPannerNode to each channel's audio path

### Deprecated ScriptProcessorNode
- Used in `fm6op-engine.ts` and `engine.ts`
- Should be migrated to AudioWorklet for better performance
- **Fix:** Refactor to use AudioWorkletNode with custom processor

### fm4op Debug Logging
- `fm4op-engine.ts` has extensive debugging code
- This appears to be older/unused code (4-op vs 6-op FM)
- **Fix:** Remove or clean up if not needed

## Completed

- [x] SYX preset loading - clicking loads into FM synth and switches tab
- [x] Console.log cleanup in production stores and engines
- [x] Responsive spectrum display (no more empty space on right)
- [x] Page title updated to OSSIAN-19
