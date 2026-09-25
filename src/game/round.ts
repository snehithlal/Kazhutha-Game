import { activePlayerIds, highestLeadPlay, nextClockwise } from './rules';
import type { GameState, Round } from './types';

export function newRound(
  state: GameState,
  starterId: string,
  number: number,
): Round {
  return {
    number,
    starterId,
    participantIds: activePlayerIds(state),
    leadSuit: null,
    plays: [],
  };
}

/** Internal reducer helper: all transfers precede finishing, atomically. */
export function resolveRound(state: GameState, cut: boolean): void {
  const { round } = state;
  if (!round.leadSuit) throw new Error('Cannot resolve an empty round.');
  const winnerId = highestLeadPlay(round.plays, round.leadSuit).playerId;
  const pile = round.plays.map((play) => play.card);
  if (cut) {
    // No ranked player can be in this round. A temporary empty hand is not a finish.
    state.players.find((player) => player.id === winnerId)!.hand.push(...pile);
  } else {
    state.discardedCards.push(...pile);
  }

  // The play order is the authoritative tie-breaker for simultaneous finishes.
  for (const play of round.plays) {
    const player = state.players.find((entry) => entry.id === play.playerId)!;
    if (
      player.hand.length === 0 &&
      !state.rankings.some((rank) => rank.playerId === player.id)
    ) {
      state.rankings.push({
        playerId: player.id,
        position: state.rankings.length + 1,
        isLast: false,
      });
    }
  }
  let active = activePlayerIds(state);
  if (active.length <= 1) {
    if (active.length === 1)
      state.rankings.push({
        playerId: active[0],
        position: state.rankings.length + 1,
        isLast: true,
      });
    // All remaining hands can empty together in a clean round: play order still ranks all seats.
    state.rankings[state.rankings.length - 1].isLast = true;
    state.status = 'finished';
    state.currentPlayerId = null;
  } else {
    active = activePlayerIds(state);
    state.currentPlayerId = active.includes(winnerId)
      ? winnerId
      : nextClockwise(state, winnerId, active);
    state.status = 'roundEnd';
  }
  state.history.push({
    number: round.number,
    starterId: round.starterId,
    leadSuit: round.leadSuit,
    plays: [...round.plays],
    cut,
    winnerId,
    outcome: cut ? 'pickup' : 'discard',
    nextLeaderId: state.currentPlayerId,
  });
}
