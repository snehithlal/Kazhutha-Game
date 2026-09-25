import { useTerms } from '../../hooks/useTerms';
export function Brand({ onClick }: { onClick?: () => void }) {
  const t = useTerms();
  return (
    <button
      className="brand"
      onClick={onClick}
      aria-label={`${t.gameName} home`}
    >
      <span className="brand-mark">
        ♠<i>✦</i>
      </span>
      <span>
        {t.gameName}
        <small>GATHER. PLAY. OUTWIT.</small>
      </span>
    </button>
  );
}
