import { makeCard, RANKS, SUITS } from './cards';
import { createDeck, deal, shuffle } from './deck';
import { legalCards, nextClockwise } from './rules';
import { newRound, resolveRound } from './round';
import type { GameOptions, GameState } from './types';

export function createInitialState(options: GameOptions): GameState {
  const { players } = options;
  if (players.length < 2 || players.length > 5)
    throw new Error('Choose 2–5 players.');
  if (
    new Set(players.map((player) => player.id)).size !== players.length ||
    players.some((player) => !player.id || !player.name.trim())
  )
    throw new Error('Players need unique IDs and nonempty names.');
  const hands =
    options.initialHands ??
    deal(shuffle(createDeck(), options.random), players.length);
  if (
    hands.length !== players.length ||
    hands.some((hand) => hand.length === 0)
  )
    throw new Error('Every player must start with cards.');
  const cards = hands.flat();
  if (
    new Set(cards.map((card) => card.id)).size !== cards.length ||
    cards.some(
      (card) =>
        !SUITS.includes(card.suit) ||
        !RANKS.includes(card.rank) ||
        makeCard(card.rank, card.suit).id !== card.id,
    )
  )
    throw new Error('Cards must be valid and unique.');
  const aceHolder = players.find((_, i) =>
    hands[i].some((card) => card.id === 'A-spades'),
  );
  const starterId = options.startingPlayerId ?? aceHolder?.id;
  if (!starterId || !players.some((player) => player.id === starterId))
    throw new Error(
      'A♠ must be present, or provide an explicit scenario starter.',
    );
  const state: GameState = {
    players: players.map((player, i) => ({ ...player, hand: [...hands[i]] })),
    currentPlayerId: starterId,
    round: {
      number: 1,
      starterId,
      participantIds: players.map((player) => player.id),
      leadSuit: null,
      plays: [],
    },
    history: [],
    discardedCards: [],
    rankings: [],
    status: 'playing',
  };
  return state;
}

/** Validates an authoritative move, returns a new state, never mutates the caller. */
export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
): GameState {
  if (state.status !== 'playing') throw new Error('The round is closed.');
  if (state.currentPlayerId !== playerId)
    throw new Error('It is not this player’s turn.');
  if (state.rankings.some((rank) => rank.playerId === playerId))
    throw new Error('Finished players cannot play.');
  const player = state.players.find((entry) => entry.id === playerId);
  const card = player?.hand.find((entry) => entry.id === cardId);
  if (!player || !card) throw new Error('The card is not in this hand.');
  if (
    !legalCards(player.hand, state.round.leadSuit).some(
      (entry) => entry.id === cardId,
    )
  )
    throw new Error('You must follow the lead suit.');
  const next: GameState = {
    ...state,
    players: state.players.map((entry) => ({
      ...entry,
      hand: entry.hand.filter(
        (held) => entry.id !== playerId || held.id !== cardId,
      ),
    })),
    round: {
      ...state.round,
      plays: [...state.round.plays, { playerId, card }],
      leadSuit: state.round.leadSuit ?? card.suit,
    },
    rankings: state.rankings.map((rank) => ({ ...rank })),
    history: [...state.history],
    discardedCards: [...state.discardedCards],
  };
  const cut =
    state.round.leadSuit !== null && card.suit !== state.round.leadSuit;
  if (cut || next.round.plays.length === next.round.participantIds.length)
    resolveRound(next, cut);
  else
    next.currentPlayerId = nextClockwise(
      next,
      playerId,
      next.round.participantIds,
    );
  return next;
}

export function advanceRound(state: GameState): GameState {
  if (state.status !== 'roundEnd' || !state.currentPlayerId)
    throw new Error('There is no next round to begin.');
  return {
    ...state,
    status: 'playing',
    round: newRound(state, state.currentPlayerId, state.round.number + 1),
  };
}

/** Small stateful facade for a CLI, future authoritative server, or replay tool. */
export function createGame(options: GameOptions) {
  let state = createInitialState(options);
  return {
    getState: (): GameState => structuredClone(state),
    playCard: (playerId: string, cardId: string) => {
      state = playCard(state, playerId, cardId);
      return structuredClone(state);
    },
    advanceRound: () => {
      state = advanceRound(state);
      return structuredClone(state);
    },
  };
}
