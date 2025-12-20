// FM4Op Types - Shared type definitions to avoid circular dependencies

import { Fm4OpParams } from './fm4op-engine';
import { EffectParams } from './effects';

// FM4Op Preset interface
export interface Fm4OpPreset {
  name: string;
  category: string;
  params: Fm4OpParams;
  effects: EffectParams;
}
