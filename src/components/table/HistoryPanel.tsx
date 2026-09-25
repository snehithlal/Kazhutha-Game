import { Clock3 } from 'lucide-react';
import { SUIT_SYMBOLS } from '../../game';
import type { GameState } from '../../game';
import { useTerms } from '../../hooks/useTerms';

export function HistoryPanel({ game }: { game: GameState }) {
  const t = useTerms();
  const name = (id: string) =>
    game.players.find((player) => player.id === id)?.name ?? '';
  return (
    <div className="history-list">
      {game.history.length === 0 ? (
        <div className="history-empty">
          <Clock3 size={32} />
          <h3>The story starts here.</h3>
          <p>Completed rounds will appear here.</p>
        </div>
      ) : (
        [...game.history].reverse().map((round) => {
          const cutPlay = round.cut ? round.plays.at(-1) : undefined;
          return (
            <article key={round.number} className="history-round">
              <div className="history-round-heading">
                <strong>
                  {t.round} {round.number}
                </strong>
                <span className={round.cut ? 'cut-badge' : 'clean-badge'}>
                  {round.cut ? t.cut : t.cleanRound}
                </span>
              </div>
              <p>
                {name(round.starterId)} led {SUIT_SYMBOLS[round.leadSuit]}
              </p>
              <div className="history-plays">
                {round.plays.map(({ playerId, card }) => (
                  <div key={card.id}>
                    <span
                      className={`history-card ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red' : ''}`}
                    >
                      {card.rank}
                      {SUIT_SYMBOLS[card.suit]}
                    </span>
                    <small>{name(playerId)}</small>
                  </div>
                ))}
              </div>
              <p className="history-outcome">
                {round.cut
                  ? cutPlay
                    ? `${name(cutPlay.playerId)} cut with ${cutPlay.card.rank}${SUIT_SYMBOLS[cutPlay.card.suit]} · ${name(round.winnerId)} took the pile`
                    : t.pickup(name(round.winnerId))
                  : `${t.discarded} · ${name(round.winnerId)} won`}
              </p>
              <small>
                {round.nextLeaderId
                  ? t.nextLead(name(round.nextLeaderId))
                  : 'Final ranking complete'}
              </small>
            </article>
          );
        })
      )}
    </div>
  );
}
