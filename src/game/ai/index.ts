import type { Difficulty, GameState, Random } from '../types';
import { easyAi } from './easyAi';
import { mediumAi } from './mediumAi';
import { hardAi } from './hardAi';
import { observeGame } from './memory';
export { observeGame, buildMemory } from './memory';
export { easyAi, mediumAi, hardAi };

export function chooseAiCard(
  state: GameState,
  difficulty: Difficulty,
  random: Random = Math.random,
) {
  if (state.status !== 'playing' || !state.currentPlayerId)
    throw new Error('AI cannot move in a closed round.');
  const observation = observeGame(state, state.currentPlayerId);
  return difficulty === 'easy'
    ? easyAi(observation, random)
    : difficulty === 'medium'
      ? mediumAi(observation)
      : hardAi(observation);
}
