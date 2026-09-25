import { useCallback, useEffect, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { HomeScreen } from './screens/HomeScreen';
import { NewGameScreen } from './screens/NewGameScreen';
import { GameScreen } from './screens/GameScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Modal } from './components/common/Modal';
import { useGameStore } from './store/gameStore';
import { useSettings } from './store/settingsStore';
import { useTerms } from './hooks/useTerms';
import { audio } from './utils/audio';
import type { PlayerConfig } from './game';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'setup' | 'game'>('home');
  const [modal, setModal] = useState<'how' | 'settings' | null>(null);
  const game = useGameStore((state) => state.game);
  const animations = useSettings((state) => state.animations);
  const reducedMotion = useReducedMotion();
  const t = useTerms();
  const closeModal = useCallback(() => setModal(null), []);
  const start = (players: PlayerConfig[]) => {
    audio.unlock();
    useGameStore.getState().start(players);
    setScreen('game');
  };
  useEffect(() => {
    document.title = `${t.gameName} · Gather. Play. Outwit.`;
  }, [t]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);
  return (
    <MotionConfig
      reducedMotion={animations ? 'user' : 'always'}
      transition={animations && !reducedMotion ? undefined : { duration: 0 }}
    >
      <div className={!animations || reducedMotion ? 'reduce-motion' : ''}>
        <div inert={modal ? true : undefined}>
          {screen === 'home' && (
            <HomeScreen
              hasGame={!!game && game.status !== 'finished'}
              onPlay={() => {
                audio.unlock();
                setScreen(
                  game && game.status !== 'finished' ? 'game' : 'setup',
                );
              }}
              onHow={() => setModal('how')}
              onSettings={() => setModal('settings')}
            />
          )}
          {screen === 'setup' && (
            <NewGameScreen onBack={() => setScreen('home')} onStart={start} />
          )}
          {screen === 'game' && (
            <GameScreen
              onHome={() => setScreen('home')}
              onSettings={() => setModal('settings')}
              paused={modal !== null}
              onAgain={() => setScreen('setup')}
            />
          )}
        </div>
        {modal && (
          <Modal
            title={
              modal === 'how' ? 'A seat at the table' : 'Make yourself at home'
            }
            onClose={closeModal}
          >
            {modal === 'how' ? (
              <HowToPlayScreen />
            ) : (
              <SettingsScreen onHow={() => setModal('how')} />
            )}
          </Modal>
        )}
      </div>
    </MotionConfig>
  );
}
