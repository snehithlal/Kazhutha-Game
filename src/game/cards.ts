import type { Card, Rank, Suit } from './types';

export const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
export const RANKS: Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];
export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const RANK_NAMES: Partial<Record<Rank, string>> = {
  A: 'Ace',
  K: 'King',
  Q: 'Queen',
  J: 'Jack',
};
export const makeCard = (rank: Rank, suit: Suit): Card => ({
  id: `${rank}-${suit}`,
  rank,
  suit,
});
export const rankValue = (card: Card): number => RANKS.indexOf(card.rank) + 2;
export const cardLabel = (card: Card): string =>
  `${RANK_NAMES[card.rank] ?? card.rank} of ${card.suit[0].toUpperCase()}${card.suit.slice(1)}`;
export const isRed = (suit: Suit): boolean =>
  suit === 'hearts' || suit === 'diamonds';
export const sortCards = (cards: Card[]): Card[] =>
  [...cards].sort(
    (a, b) =>
      SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) ||
      rankValue(b) - rankValue(a),
  );
