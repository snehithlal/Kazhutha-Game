import { describe, expect, it } from 'vitest';
import {
  advanceRound,
  createDeck,
  createGame,
  createInitialState,
  deal,
  highestLeadPlay,
  legalCards,
  makeCard,
  playCard,
  rankValue,
  seededRandom,
  shuffle,
} from './index';
import type { Card, GameState, PlayerConfig, Rank, Suit } from './types';

const c = (rank: Rank, suit: Suit = 'diamonds') => makeCard(rank, suit);
const seats = (count: number): PlayerConfig[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i + 1}`,
    type: 'human',
  }));
const scenario = (hands: Card[][], starter = 'p0') =>
  createInitialState({
    players: seats(hands.length),
    initialHands: hands,
    startingPlayerId: starter,
  });
const move = (state: GameState, card: Card) =>
  playCard(state, state.currentPlayerId!, card.id);
const hand = (state: GameState, id: string) =>
  state.players.find((p) => p.id === id)!.hand;

describe('deck and setup', () => {
  it('contains exactly 52 unique standard cards, no jokers', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'])
      expect(deck.filter((card) => card.suit === suit)).toHaveLength(13);
  });
  it('shuffles reproducibly without modifying or losing cards', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, seededRandom(42));
    expect(shuffled).toEqual(shuffle(deck, seededRandom(42)));
    expect(shuffled).not.toEqual(deck);
    expect(shuffled.map((card) => card.id).sort()).toEqual(
      deck.map((card) => card.id).sort(),
    );
    expect(deck).toEqual(createDeck());
  });
  it.each([
    [2, [26, 26]],
    [3, [18, 17, 17]],
    [4, [13, 13, 13, 13]],
    [5, [11, 11, 10, 10, 10]],
  ] as const)('deals all cards to %i players', (count, sizes) => {
    expect(deal(createDeck(), count).map((cards) => cards.length)).toEqual(
      sizes,
    );
  });
  it.each([2, 3, 4, 5])('starts with the A♠ holder for %i seats', (count) => {
    const state = createInitialState({
      players: seats(count),
      random: seededRandom(count),
    });
    expect(
      hand(state, state.currentPlayerId!).some(
        (card) => card.id === 'A-spades',
      ),
    ).toBe(true);
  });
  it('lets the A♠ holder open with ANY card', () => {
    const state = scenario([
      [c('A', 'spades'), c('2', 'hearts')],
      [c('K', 'hearts')],
    ]);
    expect(move(state, c('2', 'hearts')).round.leadSuit).toBe('hearts');
  });
  it('orders ranks A > K > Q > J > 10 ... > 2', () => {
    expect(
      ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].map(
        (rank) => rankValue(c(rank as Rank)),
      ),
    ).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
  it('rejects duplicate cards, empty hands and invalid seats', () => {
    expect(() => scenario([[c('2')], [c('2')]])).toThrow('unique');
    expect(() => scenario([[], [c('2')]])).toThrow('start with cards');
    expect(() => createInitialState({ players: seats(1) })).toThrow();
    expect(() => deal(createDeck(), 6)).toThrow();
    expect(() =>
      createInitialState({ players: [seats(2)[0], seats(2)[0]] }),
    ).toThrow('unique IDs');
  });
  it('requires the ace or an explicit fixture leader', () => {
    expect(() =>
      createInitialState({
        players: seats(2),
        initialHands: [[c('2')], [c('3')]],
      }),
    ).toThrow('A♠');
  });
});

describe('legal moves and cuts', () => {
  it('requires the lead suit if held, and otherwise permits any card', () => {
    const cards = [c('7', 'hearts'), c('A', 'clubs'), c('Q', 'spades')];
    expect(legalCards(cards, 'hearts')).toEqual([cards[0]]);
    expect(legalCards(cards, 'diamonds')).toEqual(cards);
    expect(legalCards(cards, null)).toEqual(cards);
  });
  it('rejects an illegal off-suit move without mutating state', () => {
    const state = move(
      scenario([[c('K', 'hearts')], [c('7', 'hearts'), c('A', 'clubs')]]),
      c('K', 'hearts'),
    );
    const original = structuredClone(state);
    expect(() => playCard(state, 'p1', 'A-clubs')).toThrow('follow');
    expect(state).toEqual(original);
  });
  it('rejects out-of-turn cards and cards not owned', () => {
    const state = scenario([[c('2')], [c('3')]]);
    expect(() => playCard(state, 'p1', '3-diamonds')).toThrow('turn');
    expect(() => playCard(state, 'p0', '3-diamonds')).toThrow('hand');
  });
  it('ends at the FIRST cut, before subsequent players; no second cut is possible', () => {
    let state = scenario([
      [c('7'), c('2', 'clubs')],
      [c('A', 'spades'), c('3', 'clubs')],
      [c('K'), c('4', 'clubs')],
      [c('5', 'clubs')],
    ]);
    state = move(state, c('7'));
    state = move(state, c('A', 'spades'));
    expect(state.status).toBe('roundEnd');
    expect(state.round.plays).toHaveLength(2);
    expect(state.history[0].cut).toBe(true);
    expect(hand(state, 'p2')).toHaveLength(2);
    expect(hand(state, 'p3')).toHaveLength(1);
    expect(() => playCard(state, 'p2', 'K-diamonds')).toThrow('closed');
    expect(() => playCard(state, 'p0', '2-clubs')).toThrow('closed');
  });
  it('7♦ 6♦ K♦ A♠: K♦ takes ALL cards and leads, never the cut ace', () => {
    let state = scenario([
      [c('7'), c('2', 'clubs')],
      [c('6'), c('3', 'clubs')],
      [c('K'), c('4', 'clubs')],
      [c('A', 'spades'), c('5', 'clubs')],
    ]);
    for (const card of [c('7'), c('6'), c('K'), c('A', 'spades')])
      state = move(state, card);
    expect(state.history[0].winnerId).toBe('p2');
    expect(state.history[0].outcome).toBe('pickup');
    expect(hand(state, 'p2').map((card) => card.id)).toEqual([
      '4-clubs',
      '7-diamonds',
      '6-diamonds',
      'K-diamonds',
      'A-spades',
    ]);
    expect(state.discardedCards).toHaveLength(0);
    expect(advanceRound(state).currentPlayerId).toBe('p2');
  });
  it('never compares an off-suit card to lead-suit ranks', () => {
    expect(
      highestLeadPlay(
        [
          { playerId: 'p0', card: c('2') },
          { playerId: 'p1', card: c('A', 'spades') },
        ],
        'diamonds',
      ).playerId,
    ).toBe('p0');
  });
  it('discards an entire clean round permanently; winner keeps no played cards', () => {
    let state = scenario([
      [c('A'), c('2', 'clubs')],
      [c('7'), c('3', 'clubs')],
      [c('K'), c('4', 'clubs')],
      [c('3'), c('5', 'clubs')],
    ]);
    for (const card of [c('A'), c('7'), c('K'), c('3')])
      state = move(state, card);
    expect(state.discardedCards).toHaveLength(4);
    expect(state.players.map((p) => p.hand.length)).toEqual([1, 1, 1, 1]);
    expect(state.history[0]).toMatchObject({
      cut: false,
      winnerId: 'p0',
      nextLeaderId: 'p0',
      outcome: 'discard',
      starterId: 'p0',
      leadSuit: 'diamonds',
      number: 1,
    });
    const next = advanceRound(state);
    expect(next.round).toMatchObject({
      number: 2,
      leadSuit: null,
      plays: [],
      starterId: 'p0',
    });
    expect(next.discardedCards).toHaveLength(4);
  });
});

describe('agreed finishing semantics', () => {
  it('does not finish a temporarily empty player before the round resolves', () => {
    const state = move(
      scenario([[c('K')], [c('6'), c('2', 'clubs')], [c('A', 'spades')]]),
      c('K'),
    );
    expect(hand(state, 'p0')).toHaveLength(0);
    expect(state.rankings).toEqual([]);
    expect(state.status).toBe('playing');
  });
  it('returns the cut pile BEFORE checking zero-card finishes', () => {
    let state = scenario([
      [c('K')],
      [c('6'), c('2', 'clubs')],
      [c('A', 'spades')],
      [c('3', 'clubs')],
    ]);
    for (const card of [c('K'), c('6'), c('A', 'spades')])
      state = move(state, card);
    expect(hand(state, 'p0')).toHaveLength(3);
    expect(state.rankings).toEqual([
      { playerId: 'p2', position: 1, isLast: false },
    ]);
    expect(state.currentPlayerId).toBe('p0');
  });
  it('finishes an empty follower and cutter, but not the empty winner who picks up', () => {
    let state = scenario([
      [c('K')],
      [c('6')],
      [c('A', 'spades')],
      [c('2', 'clubs'), c('3', 'clubs')],
    ]);
    for (const card of [c('K'), c('6'), c('A', 'spades')])
      state = move(state, card);
    expect(state.rankings.map((r) => r.playerId)).toEqual(['p1', 'p2']);
    expect(state.rankings.map((r) => r.position)).toEqual([1, 2]);
    const next = advanceRound(state);
    expect(next.round.participantIds).toEqual(['p0', 'p3']);
  });
  it('ranks clean-round simultaneous finishes in PLAY order, not seat order', () => {
    let state = scenario(
      [
        [c('2')],
        [c('3'), c('4', 'clubs')],
        [c('K')],
        [c('5'), c('6', 'clubs')],
      ],
      'p2',
    );
    for (const card of [c('K'), c('5'), c('2'), c('3')])
      state = move(state, card);
    expect(state.rankings.map((r) => r.playerId)).toEqual(['p2', 'p0']);
    expect(state.currentPlayerId).toBe('p3');
  });
  it('passes lead clockwise when a clean-round winner finishes', () => {
    let state = scenario([
      [c('A')],
      [c('7'), c('2', 'clubs')],
      [c('K'), c('3', 'clubs')],
    ]);
    for (const card of [c('A'), c('7'), c('K')]) state = move(state, card);
    expect(state.rankings[0].playerId).toBe('p0');
    expect(state.history[0].winnerId).toBe('p0');
    expect(state.history[0].nextLeaderId).toBe('p1');
    expect(advanceRound(state).round.starterId).toBe('p1');
  });
  it('skips every finished seat and wraps clockwise', () => {
    let state = scenario(
      [
        [c('2')],
        [c('3'), c('2', 'clubs')],
        [c('4'), c('3', 'clubs')],
        [c('A')],
      ],
      'p3',
    );
    for (const card of [c('A'), c('2'), c('3'), c('4')])
      state = move(state, card);
    expect(state.currentPlayerId).toBe('p1');
    expect(advanceRound(state).round.participantIds).toEqual(['p1', 'p2']);
  });
  it('never gives finished players turns or cards in later cuts', () => {
    let state = scenario([
      [c('A')],
      [c('7'), c('2', 'clubs')],
      [c('K'), c('3', 'hearts')],
    ]);
    for (const card of [c('A'), c('7'), c('K')]) state = move(state, card);
    state = advanceRound(state);
    expect(() => playCard(state, 'p0', 'A-diamonds')).toThrow();
    state = move(state, c('2', 'clubs'));
    state = move(state, c('3', 'hearts'));
    expect(hand(state, 'p0')).toEqual([]);
    expect(hand(state, 'p1')).toHaveLength(2);
    expect(state.status).toBe('finished');
    expect(state.rankings.map((r) => r.playerId)).toEqual(['p0', 'p2', 'p1']);
  });
  it('continues after first finisher through 5 → 4 → 3 → 2 → final ranking', () => {
    let state = scenario([
      [c('2', 'clubs'), c('2'), c('2', 'hearts'), c('2', 'spades')],
      [c('3', 'clubs')],
      [c('4', 'clubs'), c('3')],
      [c('5', 'clubs'), c('4'), c('3', 'hearts')],
      [c('A', 'clubs'), c('K'), c('K', 'hearts'), c('K', 'spades')],
    ]);
    const rounds = [
      [
        c('2', 'clubs'),
        c('3', 'clubs'),
        c('4', 'clubs'),
        c('5', 'clubs'),
        c('A', 'clubs'),
      ],
      [c('K'), c('2'), c('3'), c('4')],
      [c('K', 'hearts'), c('2', 'hearts'), c('3', 'hearts')],
      [c('K', 'spades'), c('2', 'spades')],
    ];
    rounds.forEach((cards, index) => {
      expect(state.round.participantIds).toHaveLength(5 - index);
      cards.forEach((card) => {
        state = move(state, card);
      });
      if (index < 3) {
        expect(state.status).toBe('roundEnd');
        state = advanceRound(state);
      }
    });
    expect(state.status).toBe('finished');
    expect(state.rankings.map((r) => r.playerId)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
      'p0',
    ]);
    expect(state.rankings.map((r) => r.position)).toEqual([1, 2, 3, 4, 5]);
    expect(state.rankings[4].isLast).toBe(true);
    expect(state.currentPlayerId).toBeNull();
  });
  it('handles two-player cuts and a cutter finishing', () => {
    let state = scenario([[c('K')], [c('A', 'spades')]]);
    state = move(move(state, c('K')), c('A', 'spades'));
    expect(state.status).toBe('finished');
    expect(state.rankings).toEqual([
      { playerId: 'p1', position: 1, isLast: false },
      { playerId: 'p0', position: 2, isLast: true },
    ]);
    expect(hand(state, 'p0')).toHaveLength(2);
  });
  it('ranks all players when every hand empties in the final clean round', () => {
    const state = move(move(scenario([[c('K')], [c('A')]]), c('K')), c('A'));
    expect(state.status).toBe('finished');
    expect(state.rankings.map((r) => r.playerId)).toEqual(['p0', 'p1']);
    expect(state.rankings[1].isLast).toBe(true);
    expect(() => advanceRound(state)).toThrow();
    expect(() => playCard(state, 'p0', 'K-diamonds')).toThrow('closed');
  });
  it('provides a React-independent facade with isolated snapshots', () => {
    const game = createGame({ players: seats(3), random: seededRandom(12) });
    const snapshot = game.getState();
    snapshot.players[0].hand.length = 0;
    expect(game.getState().players[0].hand).toHaveLength(18);
    const state = game.getState();
    const first = hand(state, state.currentPlayerId!)[0];
    game.playCard(state.currentPlayerId!, first.id);
    expect(game.getState().round.plays).toHaveLength(1);
  });
});
