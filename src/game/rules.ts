import { rankValue } from './cards';
import type { Card, GameState, PlayedCard, Suit } from './types';

export function legalCards(
  hand: readonly Card[],
  leadSuit: Suit | null,
): Card[] {
  const matching = leadSuit
    ? hand.filter((card) => card.suit === leadSuit)
    : [];
  return matching.length ? matching : [...hand];
}
export function highestLeadPlay(
  plays: readonly PlayedCard[],
  leadSuit: Suit,
): PlayedCard {
  const eligible = plays.filter((play) => play.card.suit === leadSuit);
  if (!eligible.length)
    throw new Error('A round must contain a lead-suit card.');
  return eligible.reduce((best, play) =>
    rankValue(play.card) > rankValue(best.card) ? play : best,
  );
}
export function activePlayerIds(state: GameState): string[] {
  return state.players
    .filter(
      (player) => !state.rankings.some((rank) => rank.playerId === player.id),
    )
    .map((player) => player.id);
}
export function nextClockwise(
  state: GameState,
  afterId: string,
  eligibleIds = activePlayerIds(state),
): string | null {
  const start = state.players.findIndex((player) => player.id === afterId);
  for (let offset = 1; offset <= state.players.length; offset++) {
    const candidate = state.players[(start + offset) % state.players.length].id;
    if (eligibleIds.includes(candidate)) return candidate;
  }
  return null;
}
