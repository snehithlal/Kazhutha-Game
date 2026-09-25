import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  UsersRound,
  Sparkles,
  Heart,
  Settings,
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Brand } from '../components/common/Brand';
import { CardBack, PlayingCard } from '../components/cards/PlayingCard';
import { makeCard } from '../game';
import { useTerms } from '../hooks/useTerms';
import { useSettings } from '../store/settingsStore';

interface Props {
  onPlay: () => void;
  onHow: () => void;
  onSettings: () => void;
  hasGame: boolean;
}
export function HomeScreen({ onPlay, onHow, onSettings, hasGame }: Props) {
  const t = useTerms();
  const { language, sound, update } = useSettings();
  return (
    <div className="home-page">
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation">
          <button className="nav-link" onClick={onHow}>
            How to play <ArrowUpRight size={14} />
          </button>
          <button
            className="nav-link settings-nav"
            onClick={onSettings}
            aria-label="Settings"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <span className="nav-divider" />
          <button
            className="language-pill"
            onClick={() =>
              update({
                language: language === 'regional' ? 'english' : 'regional',
              })
            }
          >
            <span className="tiny-dot" />
            {language === 'regional' ? 'Regional' : 'English'}
            <span className="language-switch">⇄</span>
          </button>
          <button
            className="icon-button sound-button"
            aria-label={sound ? 'Mute sound' : 'Enable sound'}
            onClick={() => update({ sound: !sound })}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </nav>
      </header>
      <main>
        <section className="home-hero">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="eyebrow">
              <span className="small-spark">✳</span>
              {t.heritage}
            </div>
            <h1>
              A little strategy.
              <br />
              <em>A little mischief.</em>
            </h1>
            <p>
              Good cards. Great company. Get rid of your hand,
              <br className="desktop-break" /> outwit your friends, and don’t be
              the last one left.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={onPlay}>
                <Play size={17} fill="currentColor" />
                {hasGame ? 'Back to the table' : 'Let’s play'}
                <ArrowRight size={20} />
              </button>
              <button className="text-button" onClick={onHow}>
                <BookOpen size={18} />
                How to play
              </button>
            </div>
            <div className="no-fuss">
              <span className="tiny-dot" />
              No sign-up. No downloads. Just one more round.
            </div>
            <div className="hero-social">
              <div className="mini-avatars">
                <span>S</span>
                <span>M</span>
                <span>A</span>
                <span>R</span>
              </div>
              <div>
                Your next game night,
                <br />
                <strong>right here.</strong>
                <span className="sketch-arrow">⤴</span>
              </div>
            </div>
          </motion.div>
          <div
            className="hero-art"
            aria-label="Illustrated green card table with a hand of playing cards"
            role="img"
          >
            <div className="art-spark spark-one">✧</div>
            <div className="art-spark spark-two">✳</div>
            <div className="hero-table">
              <div className="table-stitch" />
              <span className="table-top-label">A SEAT FOR EVERYONE</span>
              <div className="hero-table-emblem">♠</div>
              <span className="table-bottom-label">
                EST. AT EVERY FAMILY GATHERING
              </span>
            </div>
            <div className="hero-card-fan" aria-hidden="true">
              <motion.div
                className="hero-card hero-card-one"
                initial={{ rotate: -35, y: 30, opacity: 0 }}
                animate={{ rotate: -23, y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.12 }}
              >
                <PlayingCard card={makeCard('7', 'diamonds')} />
              </motion.div>
              <motion.div
                className="hero-card hero-card-two"
                initial={{ rotate: -15, y: 30, opacity: 0 }}
                animate={{ rotate: -9, y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.18 }}
              >
                <PlayingCard card={makeCard('Q', 'clubs')} />
              </motion.div>
              <motion.div
                className="hero-card hero-card-three"
                initial={{ rotate: 0, y: 30, opacity: 0 }}
                animate={{ rotate: 7, y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.24 }}
              >
                <PlayingCard card={makeCard('K', 'hearts')} />
              </motion.div>
              <motion.div
                className="hero-card hero-card-four"
                initial={{ rotate: 10, y: 30, opacity: 0 }}
                animate={{ rotate: 23, y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <PlayingCard card={makeCard('A', 'spades')} />
              </motion.div>
            </div>
            <div className="hero-deck">
              <CardBack />
              <CardBack />
              <CardBack />
            </div>
            <div className="hero-note">
              <span>✦</span> Easy to learn.
              <br />
              <em>Hard to put down.</em>
            </div>
            <div className="table-tag">
              <span>52</span>CARDS.
              <br />
              ENDLESS POSSIBILITIES.
            </div>
          </div>
        </section>
        <section className="home-features" aria-label="Game features">
          <div>
            <span className="feature-icon">
              <UsersRound size={23} />
            </span>
            <div>
              <h2>Better together</h2>
              <p>2–5 players. Friends, family, or a few clever bots.</p>
            </div>
          </div>
          <div>
            <span className="feature-icon">
              <Sparkles size={23} />
            </span>
            <div>
              <h2>Play your way</h2>
              <p>Go solo or pass the phone. The classic stays classic.</p>
            </div>
          </div>
          <div>
            <span className="feature-icon">
              <Heart size={23} />
            </span>
            <div>
              <h2>A familiar kind of fun</h2>
              <p>A beloved tradition, made for wherever you are.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>
          {t.origin} <span className="footer-flower">✳</span>
        </span>
        <span className="footer-suits">
          ♠ <i>♥</i> ♣ <i>♦</i>
        </span>
        <button onClick={onSettings}>
          <Settings size={14} />
          Make yourself at home
        </button>
      </footer>
    </div>
  );
}
