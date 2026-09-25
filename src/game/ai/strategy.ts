import { createDeck } from '../deck';
import { rankValue } from '../cards';
import { highestLeadPlay, legalCards } from '../rules';
import type { Card } from '../types';
import { buildMemory, type AiObservation } from './memory';

/** Deterministic public-information heuristics. Higher score is preferable. */
export function strategicMove(view: AiObservation, hard: boolean): Card {
  const legal = legalCards(view.hand, view.leadSuit);
  if (!legal.length) throw new Error('No legal move.');
  const memory = buildMemory(view);
  const selfIndex = view.players.findIndex(
    (player) => player.id === view.selfId,
  );
  const alreadyPlayed = new Set(view.plays.map((play) => play.playerId));
  const remaining = Array.from(
    { length: view.players.length - 1 },
    (_, i) => view.players[(selfIndex + i + 1) % view.players.length],
  ).filter((player) => !player.finished && !alreadyPlayed.has(player.id));
  const visible = new Set(
    [...view.hand, ...view.discarded, ...view.plays.map((p) => p.card)].map(
      (card) => card.id,
    ),
  );
  const unseen = createDeck().filter((card) => !visible.has(card.id));
  const score = (card: Card): number => {
    const rank = rankValue(card);
    const suitLength = view.hand.filter(
      (held) => held.suit === card.suit,
    ).length;
    // Shortening a suit creates future opportunities to cut; shed dangerous high cards.
    let value = rank * 1.2 + (suitLength === 1 ? 3 : 0);
    if (view.leadSuit && card.suit !== view.leadSuit) return value + 20;
    const lead = view.leadSuit ?? card.suit;
    const currentHighest = view.plays.length
      ? highestLeadPlay(view.plays, lead)
      : null;
    const wouldWin = !currentHighest || rank > rankValue(currentHighest.card);
    const firstVoid = remaining.findIndex((p) =>
      memory.voidSuits.get(p.id)!.has(lead),
    );
    const cutKnown = firstVoid >= 0;
    const higherUnseen = unseen.filter(
      (other) => other.suit === lead && rankValue(other) > rank,
    ).length;
    const lastToPlay = remaining.length === 0;
    if (currentHighest) {
      if (!wouldWin) value += hard ? 15 : 9;
      if (wouldWin && cutKnown) value -= hard ? 65 : 30;
      if (lastToPlay) value += rank * 2; // A clean last move safely sheds the highest card.
      if (hard && !wouldWin && cutKnown) {
        const target = view.players.find(
          (p) => p.id === currentHighest.playerId,
        )!;
        value += target.count <= 2 ? 16 : 8; // Keep a nearly finished opponent holding the pile.
      }
    } else if (cutKnown) {
      if (firstVoid === 0)
        value -= rank * 1.5; // Immediate cut: minimize future high-card liability.
      else {
        const possibleOvertakers = remaining.slice(0, firstVoid);
        const knownHigher = possibleOvertakers.some((p) =>
          [...memory.knownCards.get(p.id)!.values()].some(
            (held) => held.suit === lead && rankValue(held) > rank,
          ),
        );
        const likelyOvertaken =
          higherUnseen > 0 && possibleOvertakers.some((p) => p.count > 1);
        // Low lead + an intervening higher follower + known void = a deliberate trap.
        value +=
          knownHigher || likelyOvertaken ? (hard ? 52 : 25) - rank * 2 : -45;
      }
    } else if (hard) {
      const suitRemaining = unseen.filter(
        (other) => other.suit === lead,
      ).length;
      const opponents = remaining.length || 1;
      const scarcity = Math.max(0, 1 - suitRemaining / (opponents * 3));
      value -= (higherUnseen === 0 ? 24 : 8) * scarcity;
      // Prefer safe control when high cards in this suit have already left the game.
      if (higherUnseen === 0 && suitRemaining >= opponents * 3) value += 8;
      const next = remaining[0];
      if (next && next.count <= 2 && !memory.voidSuits.get(next.id)!.has(lead))
        value += higherUnseen > 0 ? 4 : -4;
    }
    if (hard && view.hand.length <= 3 && cutKnown && wouldWin) value -= 12;
    // Near the end, safe discards are more valuable than retaining control.
    if (hard && view.rankings.length && !wouldWin) value += 3;
    return value;
  };
  return [...legal].sort(
    (a, b) => score(b) - score(a) || a.id.localeCompare(b.id),
  )[0];
}
