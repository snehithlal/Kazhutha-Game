import { Bot, Check, Crown } from 'lucide-react';
import { CardBack } from '../cards/PlayingCard';
import type { Player, PlayerRanking } from '../../game';

export function PlayerSeat({
  player,
  index,
  active,
  ranking,
  className = '',
}: {
  player: Player;
  index: number;
  active: boolean;
  ranking?: PlayerRanking;
  className?: string;
}) {
  return (
    <div
      className={`player-seat ${className} ${active ? 'active-seat' : ''} ${ranking ? 'finished-seat' : ''}`}
      aria-label={`${player.name}, ${ranking ? `position ${ranking.position}` : `${player.hand.length} cards`}${active ? ', current turn' : ''}`}
    >
      <div className={`avatar avatar-${index}`}>
        <span>{player.name.slice(0, 1).toUpperCase()}</span>
        {ranking ? (
          <span className="seat-badge">
            {ranking.position === 1 ? <Crown size={12} /> : <Check size={12} />}
          </span>
        ) : (
          <span className="seat-badge">
            {player.type === 'bot' ? <Bot size={12} /> : '●'}
          </span>
        )}
      </div>
      <div className="seat-name">
        {player.name}
        {active && (
          <span className="turn-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
      <small>
        {ranking
          ? `${ranking.position}${ranking.position === 1 ? 'st' : ranking.position === 2 ? 'nd' : ranking.position === 3 ? 'rd' : 'th'} place`
          : `${player.hand.length} cards`}
        {active ? ' · Playing' : ''}
      </small>
      {!ranking && (
        <div className="opponent-backs">
          {Array.from({ length: Math.min(player.hand.length, 5) }, (_, i) => (
            <CardBack key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
