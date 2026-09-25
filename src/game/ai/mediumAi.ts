import type { AiObservation } from './memory';
import { strategicMove } from './strategy';
export const mediumAi = (view: AiObservation) => strategicMove(view, false);
