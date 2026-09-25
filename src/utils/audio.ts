import { useSettings } from '../store/settingsStore';

let context: AudioContext | null = null;
function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  delay = 0,
) {
  if (!useSettings.getState().sound) return;
  try {
    context ??= new AudioContext();
    if (context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.65,
      context.currentTime + delay + duration,
    );
    gain.gain.setValueAtTime(0.045, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + delay + duration,
    );
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + delay);
    oscillator.stop(context.currentTime + delay + duration);
  } catch {
    /* Audio is optional, including in embedded webviews. */
  }
}
export const audio = {
  unlock: () => {
    try {
      context ??= new AudioContext();
      void context.resume().catch(() => undefined);
    } catch {
      /* Unsupported audio. */
    }
  },
  playCard: () => tone(420, 0.08, 'triangle'),
  cardDiscard: () => tone(700, 0.18, 'sine'),
  cardPickup: () => {
    tone(250, 0.1);
    tone(320, 0.12, 'triangle', 0.08);
  },
  cut: () => {
    // Low rumble
    tone(80, 0.3, 'triangle');
    tone(100, 0.25, 'sine', 0.05);
    // Sharp impact hit
    tone(220, 0.12, 'square', 0.1);
    tone(330, 0.08, 'sawtooth', 0.12);
    // Descending sting
    tone(440, 0.15, 'triangle', 0.18);
    tone(280, 0.2, 'sine', 0.25);
    tone(160, 0.25, 'triangle', 0.35);
  },
  playerFinished: () => {
    tone(520, 0.15);
    tone(780, 0.22, 'sine', 0.1);
  },
  gameWon: () => {
    [520, 650, 780, 1040].forEach((frequency, i) =>
      tone(frequency, 0.25, 'sine', i * 0.1),
    );
  },
};
