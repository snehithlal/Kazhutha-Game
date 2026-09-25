import type {
  Card,
  GameState,
  PlayedCard,
  PlayerRanking,
  RoundRecord,
  Suit,
} from '../types';

export interface PublicPlayer {
  id: string;
  count: number;
  finished: boolean;
}
export interface AiObservation {
  selfId: string;
  hand: Card[];
  players: PublicPlayer[];
  leadSuit: Suit | null;
  plays: PlayedCard[];
  history: RoundRecord[];
  discarded: Card[];
  rankings: PlayerRanking[];
}
export interface PublicMemory {
  voidSuits: Map<string, Set<Suit>>;
  knownCards: Map<string, Map<string, Card>>;
  playedCards: PlayedCard[];
  previousWinners: string[];
  cuts: number;
}

/** This is the only AI boundary: opponents' hands are never passed in. */
export function observeGame(state: GameState, selfId: string): AiObservation {
  return {
    selfId,
    hand: [...state.players.find((player) => player.id === selfId)!.hand],
    players: state.players.map((player) => ({
      id: player.id,
      count: player.hand.length,
      finished: state.rankings.some((r) => r.playerId === player.id),
    })),
    leadSuit: state.round.leadSuit,
    plays: state.round.plays,
    history: state.history,
    discarded: state.discardedCards,
    rankings: state.rankings,
  };
}

export function buildMemory(observation: AiObservation): PublicMemory {
  const memory: PublicMemory = {
    voidSuits: new Map(observation.players.map((p) => [p.id, new Set<Suit>()])),
    knownCards: new Map(
      observation.players.map((p) => [p.id, new Map<string, Card>()]),
    ),
    playedCards: [],
    previousWinners: [],
    cuts: 0,
  };
  const rememberPlay = (play: PlayedCard, lead: Suit | null) => {
    memory.playedCards.push(play);
    memory.knownCards.get(play.playerId)!.delete(play.card.id);
    memory.voidSuits.get(play.playerId)!.delete(play.card.suit);
    if (lead && play.card.suit !== lead)
      memory.voidSuits.get(play.playerId)!.add(lead);
  };
  for (const round of observation.history) {
    round.plays.forEach((play) => rememberPlay(play, round.leadSuit));
    memory.previousWinners.push(round.winnerId);
    if (round.cut) {
      memory.cuts++;
      for (const { card } of round.plays) {
        memory.knownCards.get(round.winnerId)!.set(card.id, card);
        // Pickup can invalidate a previously observed void, including the cut suit.
        memory.voidSuits.get(round.winnerId)!.delete(card.suit);
      }
    }
  }
  observation.plays.forEach((play) => rememberPlay(play, observation.leadSuit));
  return memory;
}
