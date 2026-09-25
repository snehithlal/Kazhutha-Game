import { memo } from 'react';
import { motion } from 'framer-motion';
import { cardLabel, isRed, SUIT_SYMBOLS } from '../../game';
import type { Card } from '../../game';

interface Props {
  card: Card;
  className?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
export const PlayingCard = memo(function PlayingCard({
  card,
  className = '',
  selected,
  disabled,
  onClick,
}: Props) {
  const content = (
    <>
      <span className="card-corner">
        <b>{card.rank}</b>
        <span>{SUIT_SYMBOLS[card.suit]}</span>
      </span>
      <span
        className={`card-center ${['K', 'Q', 'J'].includes(card.rank) ? 'court-card' : ''}`}
        aria-hidden="true"
      >
        {['K', 'Q', 'J'].includes(card.rank) && (
          <span className="court-ornament">✧</span>
        )}
        {SUIT_SYMBOLS[card.suit]}
        {['K', 'Q', 'J'].includes(card.rank) && (
          <span className="court-ornament">✧</span>
        )}
      </span>
      <span className="card-corner card-corner-bottom">
        <b>{card.rank}</b>
        <span>{SUIT_SYMBOLS[card.suit]}</span>
      </span>
    </>
  );
  const classes = `playing-card ${isRed(card.suit) ? 'red-card' : 'black-card'} ${selected ? 'selected-card' : ''} ${className}`;
  return onClick ? (
    <motion.button
      type="button"
      aria-label={cardLabel(card)}
      aria-pressed={!!selected}
      disabled={disabled}
      className={classes}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -8 }}
      whileTap={{ scale: 0.97 }}
    >
      {content}
    </motion.button>
  ) : (
    <div className={classes} role="img" aria-label={cardLabel(card)}>
      {content}
    </div>
  );
});

export function CardBack({ className = '' }: { className?: string }) {
  return (
    <div className={`card-back ${className}`} aria-hidden="true">
      <div>
        <span>✦</span>
      </div>
    </div>
  );
}
