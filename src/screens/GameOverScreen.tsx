import { ArrowRight, Crown, RotateCcw } from 'lucide-react';
import type { GameState } from '../game';
import { useTerms } from '../hooks/useTerms';

export function GameOverScreen({
  game,
  onAgain,
  onHome,
}: {
  game: GameState;
  onAgain: () => void;
  onHome: () => void;
}) {
  const t = useTerms();
  const winner = game.players.find((p) => p.id === game.rankings[0]?.playerId);
  return (
    <div className="game-over">
      <div className="winner-crown">
        <Crown size={35} />
      </div>
      <div className="eyebrow">THAT’S A GOOD GAME</div>
      <h2>{winner?.name} takes the win.</h2>
      <p>Empty hands. Full bragging rights.</p>
      <div className="ranking-list">
        {game.rankings.map((rank) => {
          const player = game.players.find((p) => p.id === rank.playerId)!;
          return (
            <div
              key={rank.playerId}
              className={rank.position === 1 ? 'first-place' : ''}
            >
              <span className="rank-number">
                {String(rank.position).padStart(2, '0')}
              </span>
              <strong>{player.name}</strong>
              <small>
                {rank.position === 1
                  ? t.winner
                  : rank.isLast
                    ? t.lastPlayer
                    : 'Finished'}
              </small>
              {rank.position === 1 && <Crown size={18} />}
            </div>
          );
        })}
      </div>
      <button className="primary-button" onClick={onAgain}>
        <RotateCcw size={17} />
        One more round?
        <ArrowRight size={18} />
      </button>
      <button className="text-button" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}
