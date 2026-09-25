import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Difficulty } from '../game';
import type { LanguageMode } from '../terminology';

interface Preferences {
  language: LanguageMode;
  sound: boolean;
  animations: boolean;
  difficulty: Difficulty;
}
interface Settings extends Preferences {
  update: (preferences: Partial<Preferences>) => void;
}
export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      language: 'regional',
      sound: true,
      animations: true,
      difficulty: 'medium',
      update: (preferences) => set(preferences),
    }),
    {
      name: 'kazhutha-preferences',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch {
            /* Private browsing can disable persistence. */
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            /* Keep preferences in memory. */
          }
        },
      })),
      partialize: ({ language, sound, animations, difficulty }) => ({
        language,
        sound,
        animations,
        difficulty,
      }),
    },
  ),
);
