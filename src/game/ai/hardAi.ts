import type { AiObservation } from './memory';
import { strategicMove } from './strategy';
export const hardAi = (view: AiObservation) => strategicMove(view, true);
