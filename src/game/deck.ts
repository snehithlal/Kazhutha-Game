import { makeCard, RANKS, SUITS } from './cards';
import type { Card, Random } from './types';

export const createDeck = (): Card[] =>
  SUITS.flatMap((suit) => RANKS.map((rank) => makeCard(rank, suit)));
export function seededRandom(seed: number): Random {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(
  deck: readonly Card[],
  random: Random = Math.random,
): Card[] {
  const cards = [...deck];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function deal(deck: readonly Card[], count: number): Card[][] {
  if (!Number.isInteger(count) || count < 2 || count > 7)
    throw new Error('Choose 2–7 players.');
  const hands: Card[][] = Array.from({ length: count }, () => []);
  deck.forEach((card, i) => hands[i % count].push(card));
  return hands;
}
