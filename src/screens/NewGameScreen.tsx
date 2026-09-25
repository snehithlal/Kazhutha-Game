import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  UserRound,
  UsersRound,
  Check,
  Shuffle,
} from 'lucide-react';
import { Brand } from '../components/common/Brand';
import { useSettings } from '../store/settingsStore';
import { useTerms } from '../hooks/useTerms';
import type { PlayerConfig } from '../game';

const botNames = ['You', 'Arun', 'Maya', 'Rahul', 'Leela'];
export function NewGameScreen({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (players: PlayerConfig[]) => void;
}) {
  const [count, setCount] = useState(4);
  const [mode, setMode] = useState<'single' | 'pass'>('single');
  const [players, setPlayers] = useState<PlayerConfig[]>(
    botNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      type: index === 0 ? 'human' : 'bot',
    })),
  );
  const { difficulty, language, update } = useSettings();
  const t = useTerms();
  const setSeat = (index: number, changes: Partial<PlayerConfig>) =>
    setPlayers((previous) =>
      previous.map((player, i) =>
        i === index ? { ...player, ...changes } : player,
      ),
    );
  const chooseMode = (next: 'single' | 'pass') => {
    setMode(next);
    setPlayers((previous) =>
      previous.map((player, index) => ({
        ...player,
        type: index === 0 || (next === 'pass' && index === 1) ? 'human' : 'bot',
      })),
    );
  };
  const valid = players.slice(0, count).every((p) => p.name.trim());
  return (
    <div className="inner-page">
      <header className="site-header">
        <Brand onClick={onBack} />
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back home
        </button>
      </header>
      <main className="setup-main">
        <div className="page-intro">
          <div className="eyebrow">PULL UP A CHAIR</div>
          <h1>Make it a game night.</h1>
          <p>
            A familiar face or a worthy opponent. There’s room for everyone.
          </p>
        </div>
        <form
          className="setup-card"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid)
              onStart(
                players
                  .slice(0, count)
                  .map((p) => ({ ...p, name: p.name.trim() })),
              );
          }}
        >
          <div className="setup-grid">
            <section>
              <label className="field-heading">
                01 <span>Choose your company</span>
              </label>
              <div className="mode-options">
                <button
                  type="button"
                  className={`mode-option ${mode === 'single' ? 'chosen' : ''}`}
                  onClick={() => chooseMode('single')}
                  aria-pressed={mode === 'single'}
                >
                  <Bot size={24} />
                  <strong>Single player</strong>
                  <small>You + clever bots</small>
                  {mode === 'single' && (
                    <Check size={15} className="option-check" />
                  )}
                </button>
                <button
                  type="button"
                  className={`mode-option ${mode === 'pass' ? 'chosen' : ''}`}
                  onClick={() => chooseMode('pass')}
                  aria-pressed={mode === 'pass'}
                >
                  <UsersRound size={24} />
                  <strong>Pass & play</strong>
                  <small>One device, good company</small>
                  {mode === 'pass' && (
                    <Check size={15} className="option-check" />
                  )}
                </button>
              </div>
              <label className="field-heading player-number-heading">
                02 <span>Seats at the table</span>
              </label>
              <div className="seat-count" aria-label="Number of players">
                {[2, 3, 4, 5].map((number) => (
                  <button
                    type="button"
                    aria-pressed={number === count}
                    key={number}
                    className={number === count ? 'chosen' : ''}
                    onClick={() => setCount(number)}
                  >
                    {number}
                    <small>players</small>
                  </button>
                ))}
              </div>
              <label className="field-heading player-number-heading">
                03 <span>A little friendly competition</span>
              </label>
              <div className="segmented" aria-label="AI difficulty">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    type="button"
                    key={level}
                    className={difficulty === level ? 'active' : ''}
                    aria-pressed={difficulty === level}
                    onClick={() => update({ difficulty: level })}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="field-note">
                {difficulty === 'easy'
                  ? 'A relaxed table. A good place to find your feet.'
                  : difficulty === 'medium'
                    ? 'A thoughtful opponent with a trick or two up its sleeve.'
                    : 'A sharp memory, calculated moves, and a few clever traps.'}
              </p>
            </section>
            <section className="players-setup">
              <div className="field-heading">
                <UsersRound size={17} />
                <span>Meet your table</span>
              </div>
              <div className="setup-player-list">
                {players.slice(0, count).map((player, index) => (
                  <div className="setup-player" key={player.id}>
                    <span className={`avatar avatar-${index}`}>
                      {player.type === 'bot' ? (
                        <Bot size={21} />
                      ) : (
                        <UserRound size={21} />
                      )}
                    </span>
                    <label>
                      <span>
                        {index === 0 ? 'Your seat' : `Seat ${index + 1}`}
                      </span>
                      <input
                        aria-label={
                          index === 0 ? 'Your name' : `Seat ${index + 1} name`
                        }
                        value={player.name}
                        maxLength={18}
                        onChange={(event) =>
                          setSeat(index, { name: event.target.value })
                        }
                        required
                      />
                    </label>
                    {index === 0 ? (
                      <span className="you-tag">YOU</span>
                    ) : (
                      <select
                        aria-label={`Seat ${index + 1} type`}
                        value={player.type}
                        onChange={(event) => {
                          const type = event.target.value as 'human' | 'bot';
                          if (type === 'human') setMode('pass');
                          setSeat(index, { type });
                        }}
                      >
                        <option value="bot">Bot</option>
                        <option value="human">Human</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="fill-bots"
                onClick={() => {
                  setPlayers((previous) =>
                    previous.map((p, i) => (i ? { ...p, type: 'bot' } : p)),
                  );
                  setMode('single');
                }}
              >
                <Shuffle size={15} />
                Fill remaining seats with bots
              </button>
              <div className="terminology-choice">
                <div>
                  <strong>A familiar name</strong>
                  <p>Same game. Your preferred terms.</p>
                </div>
                <div className="segmented">
                  {(['regional', 'english'] as const).map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={language === value ? 'active' : ''}
                      aria-pressed={language === value}
                      onClick={() => update({ language: value })}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <div className="setup-bottom">
            <span>
              <span className="tiny-dot" />
              {count} players · 52 cards · {t.gameName}
            </span>
            <button className="primary-button" disabled={!valid}>
              Deal me in
              <ArrowRight size={19} />
            </button>
          </div>
        </form>
        <p className="setup-footnote">
          No trump cards. No special powers. Just you, your cards, and a little
          strategy.
        </p>
      </main>
    </div>
  );
}
