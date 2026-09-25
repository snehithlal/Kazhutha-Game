import { useSettings } from '../store/settingsStore';
import { terminology } from '../terminology';
export function useTerms() {
  return terminology[useSettings((state) => state.language)];
}
