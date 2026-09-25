import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Eye,
  LockKeyhole,
  Settings,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Brand } from '../components/common/Brand';
import { Modal } from '../components/common/Modal';
import { CardBack, PlayingCard } from '../components/cards/PlayingCard';
import { PlayerSeat } from '../components/players/PlayerSeat';
import { HistoryPanel } from '../components/table/HistoryPanel';
import { legalCards, sortCards, SUIT_SYMBOLS } from '../game';
import { chooseAiCard } from '../game/ai';
import { useGameStore } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';
import { useTerms } from '../hooks/useTerms';
import { audio } from '../utils/audio';
import { GameOverScreen } from './GameOverScreen';

export function GameScreen({
  onHome,
  onSettings,
  paused,
  onAgain,
}: {
  onHome: () => void;
  onSettings: () => void;
  paused: boolean;
  onAgain: () => void;
}) {
  const { game, revealedPlayerId, play, advance, reveal } = useGameStore();
  const { sound, animations, difficulty, update } = useSettings();
  const reducedMotion = useReducedMotion();
  const animate = animations && !reducedMotion;
  const [selected, setSelected] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [dealing, setDealing] = useState(
    () => game?.round.number === 1 && game.round.plays.length === 0,
  );
  const [error, setError] = useState('');
  const lastHistory = useRef(game?.history.length ?? 0);
  const lastRankings = useRef(game?.rankings.length ?? 0);
  const t = useTerms();
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const closeResults = useCallback(() => setResultOpen(false), []);

  useEffect(() => {
    if (dealing) {
      const timer = setTimeout(() => setDealing(false), animate ? 1000 : 0);
      return () => clearTimeout(timer);
    }
  }, [dealing, animate]);
  useEffect(() => {
    if (!game || paused || historyOpen || dealing) return;
    if (game.status === 'finished') {
      const timer = setTimeout(
        () => {
          setResultOpen(true);
          audio.gameWon();
        },
        animate ? 1000 : 100,
      );
      return () => clearTimeout(timer);
    }
    if (game.status === 'roundEnd') {
      const timer = setTimeout(advance, animate ? 1100 : 420);
      return () => clearTimeout(timer);
    }
    const current = game.players.find(
      (player) => player.id === game.currentPlayerId,
    );
    if (current?.type === 'bot') {
      const timer = setTimeout(
        () => {
          const card = chooseAiCard(game, difficulty);
          play(current.id, card.id);
          audio.playCard();
        },
        animate ? 850 : 280,
      );
      return () => clearTimeout(timer);
    }
  }, [game, paused, historyOpen, dealing, difficulty, animate, play, advance]);
  useEffect(() => {
    if (!game) return;
    if (game.history.length > lastHistory.current) {
      const result = game.history.at(-1)!;
      if (result.cut) {
        audio.cut();
        audio.cardPickup();
      } else audio.cardDiscard();
      lastHistory.current = game.history.length;
    }
    if (game.rankings.length > lastRankings.current) {
      audio.playerFinished();
      lastRankings.current = game.rankings.length;
    }
  }, [game]);

  if (!game) return null;
  const humans = game.players.filter((p) => p.type === 'human');
  const multiHuman = humans.length > 1;
  const current = game.players.find((p) => p.id === game.currentPlayerId);
  const viewer = multiHuman && current?.type === 'human' ? current : humans[0];
  const viewerIndex = game.players.findIndex((p) => p.id === viewer.id);
  const opponents = Array.from(
    { length: game.players.length - 1 },
    (_, i) => game.players[(viewerIndex + i + 1) % game.players.length],
  );
  const viewerRanking = game.rankings.find((r) => r.playerId === viewer.id);
  const needsPass =
    multiHuman &&
    current?.type === 'human' &&
    revealedPlayerId !== current.id &&
    game.status === 'playing' &&
    !dealing;
  const handVisible =
    !multiHuman ||
    (game.status === 'playing' &&
      current?.id === viewer.id &&
      revealedPlayerId === viewer.id);
  const yourTurn =
    game.status === 'playing' &&
    current?.id === viewer.id &&
    handVisible &&
    !dealing &&
    !paused &&
    !historyOpen;
  const legal = new Set(
    yourTurn
      ? legalCards(viewer.hand, game.round.leadSuit).map((c) => c.id)
      : [],
  );
  const cards = sortCards(viewer.hand);
  const selection = yourTurn
    ? cards.find((c) => c.id === selected && legal.has(c.id))
    : undefined;
  const result = game.status !== 'playing' ? game.history.at(-1) : undefined;
  const name = (id: string) =>
    game.players.find((p) => p.id === id)?.name ?? '';
  const positions: Record<number, string[]> = {
    1: ['seat-top'],
    2: ['seat-upper-left', 'seat-upper-right'],
    3: ['seat-left', 'seat-top', 'seat-right'],
    4: ['seat-left', 'seat-upper-left', 'seat-upper-right', 'seat-right'],
  };
  const playSelected = () => {
    if (!selection || !yourTurn) return;
    try {
      audio.unlock();
      play(viewer.id, selection.id);
      audio.playCard();
      setSelected(null);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Please try your move again.',
      );
    }
  };
  const winnerPosition =
    result?.winnerId === viewer.id
      ? 'bottom'
      : positions[opponents.length][
          opponents.findIndex((p) => p.id === result?.winnerId)
        ];
  const flight = result?.cut
    ? {
        x: winnerPosition?.includes('left')
          ? -160
          : winnerPosition?.includes('right')
            ? 160
            : 0,
        y:
          winnerPosition === 'bottom'
            ? 180
            : winnerPosition?.includes('top') ||
                winnerPosition?.includes('upper')
              ? -140
              : -20,
      }
    : { x: -170, y: -110 };

  return (
    <div className="game-page">
      <header
        className="site-header game-header"
        inert={needsPass || historyOpen || resultOpen ? true : undefined}
      >
        <Brand onClick={onHome} />
        <div className="game-header-actions">
          <button className="text-button back-home" onClick={onHome}>
            <ArrowLeft size={16} />
            Home
          </button>
          <button
            className="text-button"
            aria-label="History"
            onClick={() => setHistoryOpen(true)}
          >
            <Clock3 size={17} />
            <span>History</span>
          </button>
          <button
            className="icon-button"
            onClick={() => update({ sound: !sound })}
            aria-label={sound ? 'Mute sound' : 'Enable sound'}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="icon-button"
            onClick={onSettings}
            aria-label="Game settings"
          >
            <Settings size={19} />
          </button>
        </div>
      </header>
      <main
        className="game-main"
        inert={needsPass || historyOpen || resultOpen ? true : undefined}
      >
        <div className="table-toolbar">
          <span className="round-pill">
            {t.round} {String(game.round.number).padStart(2, '0')}
          </span>
          <span className="table-room-label">
            A LITTLE FRIENDLY COMPETITION
          </span>
          <span className="difficulty-pill">
            <span className="tiny-dot" />
            {difficulty} bots
          </span>
        </div>
        <div className={`game-table ${dealing ? 'is-dealing' : ''}`}>
          <div className="game-table-stitch" />
          <div className="table-watermark">
            <span>♠</span>
            {t.gameName}
            <small>GATHER. PLAY. OUTWIT.</small>
          </div>
          <div className="discard-stack">
            <CardBack />
            <CardBack />
            <span>{game.discardedCards.length} discarded</span>
          </div>
          {opponents.map((player, i) => (
            <PlayerSeat
              key={player.id}
              player={player}
              index={game.players.indexOf(player)}
              active={
                current?.id === player.id &&
                game.status === 'playing' &&
                !dealing
              }
              ranking={game.rankings.find((r) => r.playerId === player.id)}
              className={positions[opponents.length][i]}
            />
          ))}
          <div className="center-play-area">
            {dealing ? (
              <div className="dealing-message">
                <motion.div
                  animate={animate ? { rotate: [0, -8, 8, 0] } : {}}
                  transition={{ duration: 0.5, repeat: 1 }}
                >
                  <CardBack />
                </motion.div>
                <span>Shuffling a little possibility…</span>
              </div>
            ) : (
              <>
                <div className="lead-suit">
                  {game.round.leadSuit ? (
                    <>
                      LEAD SUIT <span>{SUIT_SYMBOLS[game.round.leadSuit]}</span>
                    </>
                  ) : (
                    <>
                      <span className="tiny-dot" />
                      {game.round.number === 1
                        ? t.opening
                        : 'A fresh round. Make your move.'}
                    </>
                  )}
                </div>
                <div className="played-cards">
                  <AnimatePresence>
                    {game.round.plays.map(({ playerId, card }, i) => (
                      <motion.div
                        className="played-card"
                        key={`${game.round.number}-${card.id}`}
                        initial={
                          animate
                            ? {
                                opacity: 0,
                                y: playerId === viewer.id ? 170 : -80,
                                rotateY: 80,
                                scale: 0.7,
                              }
                            : false
                        }
                        animate={
                          result && animate
                            ? {
                                opacity: [1, 1, 0],
                                x: [0, 0, flight.x],
                                y: [0, 0, flight.y],
                                scale: [1, 1, 0.4],
                                rotateY: 0,
                                rotate: (i % 2 === 0 ? -1 : 1) * 6,
                              }
                            : {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                rotateY: 0,
                                rotate: (i % 2 === 0 ? -1 : 1) * 6,
                              }
                        }
                        transition={
                          result
                            ? { duration: 0.9, times: [0, 0.45, 1] }
                            : { duration: 0.35 }
                        }
                      >
                        <PlayingCard card={card} />
                        <small>{name(playerId)}</small>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {game.round.plays.length === 0 && (
                    <div className="empty-pile">
                      <span>♧</span>
                      <small>The table is yours.</small>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="table-turn-message" role="status" aria-live="polite">
            {dealing ? (
              'Dealing 52 cards around the table'
            ) : result ? (
              <>
                <strong>{result.cut ? `${t.cut}!` : t.cleanRound}</strong>
                <span>
                  {result.cut ? t.pickup(name(result.winnerId)) : t.discarded}
                </span>
              </>
            ) : (
              <>
                <span className="status-dot" />
                <strong>
                  {yourTurn
                    ? 'Your turn'
                    : current
                      ? t.turn(current.name)
                      : 'Game complete'}
                </strong>
                <span>
                  {yourTurn
                    ? game.round.leadSuit
                      ? `Follow ${SUIT_SYMBOLS[game.round.leadSuit]} if you can`
                      : 'Lead with any card'
                    : current?.type === 'bot'
                      ? 'A little thinking, a little plotting…'
                      : 'Ready when you are'}
                </span>
              </>
            )}
          </div>
          {result && game.status === 'roundEnd' && (
            <button
              className="skip-round"
              onClick={advance}
              aria-label="Skip round animation"
            >
              <SkipForward size={16} />
            </button>
          )}
          <div className={`your-seat ${yourTurn ? 'active-your-seat' : ''}`}>
            <span className={`avatar avatar-${viewerIndex}`}>
              {viewer.name[0]?.toUpperCase()}
            </span>
            <span>
              {viewer.name}
              <small>{multiHuman ? 'CURRENT SEAT' : 'YOUR SEAT'}</small>
            </span>
            <span className="hand-count">
              {viewerRanking ? <Check size={16} /> : viewer.hand.length}
            </span>
          </div>
        </div>
        <section
          className="hand-section"
          aria-label={handVisible ? `${viewer.name}’s hand` : 'Hidden hand'}
        >
          <div className="hand-topline">
            <span>
              {viewerRanking ? (
                `You finished ${viewerRanking.position}${viewerRanking.position === 1 ? 'st' : viewerRanking.position === 2 ? 'nd' : viewerRanking.position === 3 ? 'rd' : 'th'}. Enjoy the table.`
              ) : handVisible ? (
                <>
                  <strong>Your hand</strong>
                  <span className="hand-hint">
                    {yourTurn
                      ? 'Select a card, then play it'
                      : 'Take a moment. Plan your next move.'}
                  </span>
                </>
              ) : (
                <>
                  <LockKeyhole size={14} />
                  Hands are kept private
                </>
              )}
            </span>
            <span className="sorted-note">
              {handVisible && !viewerRanking ? 'SORTED BY SUIT' : ''}
            </span>
          </div>
          <div className="hand-scroll">
            <div
              className="hand-cards"
              style={
                { '--card-count': Math.max(cards.length, 1) } as CSSProperties
              }
            >
              {handVisible && !dealing
                ? cards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      className="hand-card-wrapper"
                      initial={
                        animate ? { opacity: 0, y: 65, rotateY: 90 } : false
                      }
                      animate={{
                        opacity: 1,
                        y: selected === card.id && yourTurn ? -18 : 0,
                        rotateY: 0,
                      }}
                      transition={{
                        duration: 0.25,
                        delay:
                          game.round.number === 1 &&
                          game.round.plays.length === 0
                            ? index * 0.025
                            : 0,
                      }}
                      style={{ zIndex: selected === card.id ? 60 : index + 1 }}
                    >
                      <PlayingCard
                        card={card}
                        selected={selection?.id === card.id}
                        disabled={!legal.has(card.id)}
                        className={
                          yourTurn && legal.has(card.id) ? 'legal-card' : ''
                        }
                        onClick={() =>
                          setSelected((previous) =>
                            previous === card.id ? null : card.id,
                          )
                        }
                      />
                    </motion.div>
                  ))
                : !viewerRanking && (
                    <div className="hidden-hand">
                      {Array.from({ length: 7 }, (_, i) => (
                        <CardBack key={i} />
                      ))}
                    </div>
                  )}
              {viewerRanking && (
                <div className="finished-hand">
                  <span>✦</span>A lighter hand. A well-earned rest.
                </div>
              )}
            </div>
          </div>
          <div className="hand-bottom">
            <p>
              {error ||
                (selection
                  ? `Ready to play ${selection.rank}${SUIT_SYMBOLS[selection.suit]}?`
                  : yourTurn
                    ? 'The next move is yours.'
                    : viewerRanking
                      ? 'The remaining players are still in the game.'
                      : 'Good things come to those who wait.')}
            </p>
            {game.status === 'finished' ? (
              <button
                className="primary-button"
                onClick={() => setResultOpen(true)}
              >
                See the results
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                className="primary-button play-card-button"
                disabled={!selection}
                onClick={playSelected}
              >
                Play card
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </section>
      </main>
      {needsPass && !paused && !historyOpen && (
        <div
          className="privacy-screen"
          role="dialog"
          aria-modal="true"
          aria-label="Pass the device"
        >
          <div className="privacy-decoration">
            <CardBack />
            <LockKeyhole size={30} />
          </div>
          <div className="eyebrow">A LITTLE PRIVACY, PLEASE</div>
          <h2>{t.pass(current.name)}</h2>
          <p>
            Everyone else, eyes off the cards.
            <br />
            Your hand is hidden until you’re ready.
          </p>
          <button
            className="primary-button"
            onClick={() => {
              audio.unlock();
              reveal(current.id);
            }}
            autoFocus
          >
            <Eye size={19} />
            I’m {current.name}. Show my hand
            <ArrowRight size={18} />
          </button>
          <button className="text-button" onClick={onHome}>
            Back home
          </button>
        </div>
      )}
      {historyOpen && (
        <Modal title="Around the table" onClose={closeHistory}>
          <HistoryPanel game={game} />
        </Modal>
      )}
      {resultOpen && (
        <Modal title="The final hand" onClose={closeResults}>
          <GameOverScreen game={game} onAgain={onAgain} onHome={onHome} />
        </Modal>
      )}
    </div>
  );
}
