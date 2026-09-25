import { describe, expect, it } from 'vitest';
import {
  advanceRound,
  createInitialState,
  legalCards,
  makeCard as c,
  playCard,
  seededRandom,
} from '../index';
import type { Difficulty, RoundRecord } from '../types';
import {
  buildMemory,
  chooseAiCard,
  easyAi,
  hardAi,
  mediumAi,
  observeGame,
} from './index';
import type { AiObservation } from './memory';

const publicView = (): AiObservation => ({
  selfId: 'a',
  hand: [c('A', 'hearts'), c('2', 'hearts')],
  players: [
    { id: 'a', count: 2, finished: false },
    { id: 'b', count: 4, finished: false },
    { id: 'c', count: 3, finished: false },
  ],
  leadSuit: null,
  plays: [],
  history: [],
  discarded: [],
  rankings: [],
});
const cutHistory: RoundRecord = {
  number: 1,
  starterId: 'b',
  leadSuit: 'hearts',
  plays: [
    { playerId: 'b', card: c('7', 'hearts') },
    { playerId: 'c', card: c('9', 'clubs') },
  ],
  cut: true,
  winnerId: 'b',
  outcome: 'pickup',
  nextLeaderId: 'b',
};

describe('AI strategy and public memory', () => {
  it('Hard deliberately leads 2♥ to trap B before C’s known cut', () => {
    const view = publicView();
    view.history = [cutHistory];
    expect(hardAi(view).id).toBe('2-hearts');
  });
  it('Medium also uses remembered voids for a simple trap', () => {
    const view = publicView();
    view.history = [cutHistory];
    expect(mediumAi(view).id).toBe('2-hearts');
  });
  it('Hard ducks under a high card when a later opponent will cut', () => {
    const view = publicView();
    view.hand = [c('K', 'hearts'), c('2', 'hearts')];
    view.history = [cutHistory];
    view.leadSuit = 'hearts';
    view.plays = [{ playerId: 'b', card: c('7', 'hearts') }];
    expect(hardAi(view).id).toBe('2-hearts');
  });
  it('safely sheds the ace when last to follow', () => {
    const view = publicView();
    view.leadSuit = 'hearts';
    view.plays = [
      { playerId: 'b', card: c('7', 'hearts') },
      { playerId: 'c', card: c('9', 'hearts') },
    ];
    expect(hardAi(view).id).toBe('A-hearts');
  });
  it('remembers voids, public pickups, winners and cards that leave hands', () => {
    const view = publicView();
    view.history = [cutHistory];
    let memory = buildMemory(view);
    expect(memory.voidSuits.get('c')!.has('hearts')).toBe(true);
    expect(memory.knownCards.get('b')!.has('7-hearts')).toBe(true);
    expect(memory.cuts).toBe(1);
    expect(memory.previousWinners).toEqual(['b']);
    view.leadSuit = 'hearts';
    view.plays = [{ playerId: 'b', card: c('7', 'hearts') }];
    memory = buildMemory(view);
    expect(memory.knownCards.get('b')!.has('7-hearts')).toBe(false);
  });
  it('invalidates a known void when the player later picks up that suit', () => {
    const view = publicView();
    view.history = [
      cutHistory,
      {
        number: 2,
        starterId: 'c',
        leadSuit: 'spades',
        plays: [
          { playerId: 'c', card: c('K', 'spades') },
          { playerId: 'a', card: c('3', 'hearts') },
        ],
        cut: true,
        winnerId: 'c',
        outcome: 'pickup',
        nextLeaderId: 'c',
      },
    ];
    expect(buildMemory(view).voidSuits.get('c')!.has('hearts')).toBe(false);
  });
  it('never exposes opponent hands to the AI', () => {
    const state = createInitialState({
      players: [
        { id: 'a', name: 'A', type: 'bot' },
        { id: 'b', name: 'B', type: 'bot' },
      ],
      random: seededRandom(1),
    });
    expect(observeGame(state, 'a').players[1]).not.toHaveProperty('hand');
  });
  it('Hard is deterministic and Easy is seedable', () => {
    const view = publicView();
    expect(hardAi(view)).toEqual(hardAi(view));
    expect(easyAi(view, seededRandom(12))).toEqual(
      easyAi(view, seededRandom(12)),
    );
  });
  it.each(['easy', 'medium', 'hard'] as Difficulty[])(
    '%s only follows the lead suit when possible',
    (difficulty) => {
      let state = createInitialState({
        players: [
          { id: 'a', name: 'A', type: 'bot' },
          { id: 'b', name: 'B', type: 'bot' },
        ],
        initialHands: [
          [c('K', 'hearts')],
          [c('2', 'hearts'), c('A', 'spades')],
        ],
        startingPlayerId: 'a',
      });
      state = playCard(state, 'a', 'K-hearts');
      expect(chooseAiCard(state, difficulty).id).toBe('2-hearts');
    },
  );
  it.each([2, 3, 4, 5])(
    'completes seeded %i-player games, preserving every card and finished hand',
    (count) => {
      for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
        const random = seededRandom(27 + count);
        let state = createInitialState({
          players: Array.from({ length: count }, (_, i) => ({
            id: `p${i}`,
            name: `P${i}`,
            type: 'bot',
          })),
          random,
        });
        let turns = 0;
        while (state.status !== 'finished' && turns++ < 6000) {
          if (state.status === 'roundEnd') {
            state = advanceRound(state);
            continue;
          }
          const card = chooseAiCard(state, difficulty, random);
          const player = state.players.find(
            (p) => p.id === state.currentPlayerId,
          )!;
          expect(
            legalCards(player.hand, state.round.leadSuit).map((c) => c.id),
          ).toContain(card.id);
          state = playCard(state, player.id, card.id);
          const conserved = [
            ...state.players.flatMap((p) => p.hand),
            ...state.discardedCards,
            ...(state.status === 'playing'
              ? state.round.plays.map((p) => p.card)
              : []),
          ];
          expect(conserved).toHaveLength(52);
          expect(new Set(conserved.map((c) => c.id)).size).toBe(52);
          for (const rank of state.rankings.filter((r) => !r.isLast))
            expect(
              state.players.find((p) => p.id === rank.playerId)!.hand,
            ).toHaveLength(0);
        }
        expect(
          state.status,
          `${difficulty}, ${count} players, ${turns} turns`,
        ).toBe('finished');
        expect(state.rankings).toHaveLength(count);
      }
    },
  );
});
