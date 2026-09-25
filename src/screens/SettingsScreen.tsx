import {
  Volume2,
  Sparkles,
  Languages,
  Brain,
  ArrowUpRight,
} from 'lucide-react';
import { useSettings } from '../store/settingsStore';

export function SettingsScreen({ onHow }: { onHow: () => void }) {
  const { language, sound, animations, difficulty, update } = useSettings();
  return (
    <div className="settings-content">
      <p className="modal-description">
        A few little things to make the table your own.
      </p>
      <div className="settings-row">
        <Languages size={22} />
        <div>
          <strong>Terminology</strong>
          <p>Same rules. A different way to say it.</p>
        </div>
        <div className="segmented">
          {(['regional', 'english'] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={language === mode}
              className={language === mode ? 'active' : ''}
              onClick={() => update({ language: mode })}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="settings-row">
        <Volume2 size={22} />
        <div>
          <strong>Table sounds</strong>
          <p>A soft shuffle. A satisfying play.</p>
        </div>
        <button
          role="switch"
          aria-checked={sound}
          aria-label="Table sounds"
          className={`toggle ${sound ? 'on' : ''}`}
          onClick={() => update({ sound: !sound })}
        >
          <span />
        </button>
      </div>
      <div className="settings-row">
        <Sparkles size={22} />
        <div>
          <strong>Animations</strong>
          <p>A little life in every card. Respects reduced motion.</p>
        </div>
        <button
          role="switch"
          aria-checked={animations}
          aria-label="Animations"
          className={`toggle ${animations ? 'on' : ''}`}
          onClick={() => update({ animations: !animations })}
        >
          <span />
        </button>
      </div>
      <div className="settings-row difficulty-row">
        <Brain size={22} />
        <div>
          <strong>Bot difficulty</strong>
          <p>Applies from the next bot turn.</p>
        </div>
        <div className="segmented">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              aria-pressed={difficulty === level}
              className={difficulty === level ? 'active' : ''}
              onClick={() => update({ difficulty: level })}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <button className="settings-how" onClick={onHow}>
        <span>
          Need a quick refresher?<strong>How to play</strong>
        </span>
        <ArrowUpRight size={24} />
      </button>
      <p className="settings-footnote">
        Your preferences are saved on this device.
      </p>
    </div>
  );
}
