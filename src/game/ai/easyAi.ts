import { legalCards } from '../rules';
import type { Random } from '../types';
import type { AiObservation } from './memory';

export function easyAi(view: AiObservation, random: Random = Math.random) {
  const legal = legalCards(view.hand, view.leadSuit);
  if (!legal.length) throw new Error('No legal move.');
  return legal[Math.floor(random() * legal.length)];
}
