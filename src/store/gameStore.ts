import { create } from 'zustand';
import { advanceRound, createInitialState, playCard } from '../game';
import type { GameState, PlayerConfig } from '../game';

interface GameStore {
  game: GameState | null;
  lastSetup: PlayerConfig[] | null;
  revealedPlayerId: string | null;
  start: (players: PlayerConfig[]) => void;
  play: (playerId: string, cardId: string) => void;
  advance: () => void;
  reveal: (playerId: string) => void;
  clear: () => void;
}
export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  lastSetup: null,
  revealedPlayerId: null,
  start: (players) => {
    const humans = players.filter((p) => p.type === 'human');
    set({
      game: createInitialState({ players }),
      lastSetup: players,
      revealedPlayerId: humans.length === 1 ? humans[0].id : null,
    });
  },
  play: (playerId, cardId) => {
    const { game, revealedPlayerId } = get();
    if (!game) return;
    const next = playCard(game, playerId, cardId);
    set({
      game: next,
      revealedPlayerId:
        game.players.filter((p) => p.type === 'human').length > 1
          ? null
          : revealedPlayerId,
    });
  },
  advance: () => {
    const game = get().game;
    if (game?.status === 'roundEnd') set({ game: advanceRound(game) });
  },
  reveal: (playerId) => set({ revealedPlayerId: playerId }),
  clear: () => set({ game: null, revealedPlayerId: null }),
}));
