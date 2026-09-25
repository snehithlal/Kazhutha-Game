export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank =
  'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Random = () => number;
export interface Card {
  readonly id: string;
  readonly suit: Suit;
  readonly rank: Rank;
}
export interface PlayerConfig {
  id: string;
  name: string;
  type: 'human' | 'bot';
}
export interface Player extends PlayerConfig {
  hand: Card[];
}
export interface PlayedCard {
  playerId: string;
  card: Card;
}
export interface PlayerRanking {
  playerId: string;
  position: number;
  isLast: boolean;
}
export interface RoundRecord {
  number: number;
  starterId: string;
  leadSuit: Suit;
  plays: PlayedCard[];
  cut: boolean;
  winnerId: string;
  outcome: 'pickup' | 'discard';
  nextLeaderId: string | null;
}
export interface Round {
  number: number;
  starterId: string;
  participantIds: string[];
  leadSuit: Suit | null;
  plays: PlayedCard[];
}
export interface GameState {
  players: Player[];
  currentPlayerId: string | null;
  round: Round;
  history: RoundRecord[];
  discardedCards: Card[];
  rankings: PlayerRanking[];
  status: 'playing' | 'roundEnd' | 'finished';
}
export interface GameOptions {
  players: PlayerConfig[];
  random?: Random;
  /** Explicit scenarios for tests, analysis and future saved-game tooling. */
  initialHands?: Card[][];
  startingPlayerId?: string;
}
