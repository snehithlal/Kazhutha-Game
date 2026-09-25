import { ArrowLeft, ArrowRight, Check, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { PlayingCard } from '../components/cards/PlayingCard';
import { makeCard } from '../game';
import { useTerms } from '../hooks/useTerms';
import type { Card } from '../game';

export function HowToPlayScreen() {
  const [step, setStep] = useState(0);
  const t = useTerms();
  const lessons: {
    title: string;
    body: string;
    note: string;
    cards: Card[];
  }[] = [
    {
      title: 'An empty hand is a happy hand.',
      body: 'Your goal is simple: get rid of every card. Everyone keeps playing until the final ranking is decided.',
      note: `First out takes first place. The final player is the ${t.lastPlayer.toLowerCase()}.`,
      cards: [
        makeCard('A', 'spades'),
        makeCard('K', 'hearts'),
        makeCard('7', 'clubs'),
      ],
    },
    {
      title: 'The ace gets things started.',
      body: 'All 52 cards are dealt as evenly as possible. Whoever holds the ace of spades takes the first turn.',
      note: 'The starting player may lead with ANY card. The ace doesn’t have to be played first.',
      cards: [makeCard('A', 'spades')],
    },
    {
      title: 'Follow the suit.',
      body: 'The first card sets the lead suit. If you have a card in that suit, you must play it. Your other cards will wait.',
      note: 'Hearts led? You must play a heart if you have one.',
      cards: [
        makeCard('K', 'hearts'),
        makeCard('7', 'hearts'),
        makeCard('2', 'hearts'),
      ],
    },
    {
      title: `No matching suit? ${t.cut}!`,
      body: `If you have no cards in the lead suit, play any card. That’s a ${t.cut.toLowerCase()} — and the round ends immediately. Nobody else plays.`,
      note: `There is only one ${t.cut.toLowerCase()} per round. There are no trump cards.`,
      cards: [
        makeCard('7', 'diamonds'),
        makeCard('6', 'diamonds'),
        makeCard('K', 'diamonds'),
        makeCard('A', 'spades'),
      ],
    },
    {
      title: 'A clean round. A lighter hand.',
      body: 'When everyone follows suit, all played cards leave the game for good. The highest card of the lead suit decides who leads next.',
      note: 'Aces are high, followed by K, Q, J, 10 … all the way down to 2.',
      cards: [
        makeCard('A', 'diamonds'),
        makeCard('7', 'diamonds'),
        makeCard('K', 'diamonds'),
        makeCard('3', 'diamonds'),
      ],
    },
    {
      title: 'The highest lead card takes it all.',
      body: `After a ${t.cut.toLowerCase()}, the player with the highest card of the ORIGINAL lead suit picks up the entire pile and leads next.`,
      note: 'K♦ takes this pile, including A♠. The off-suit ace does not win.',
      cards: [
        makeCard('7', 'diamonds'),
        makeCard('6', 'diamonds'),
        makeCard('K', 'diamonds'),
        makeCard('A', 'spades'),
      ],
    },
    {
      title: 'Out of cards. Into the rankings.',
      body: 'We check for empty hands after the pile is resolved. Finishers leave the table; everyone else keeps going. A temporarily empty hand that picks up a pile is still in.',
      note: 'Finish together? Play order decides position. If the winner finishes, the next active player clockwise leads.',
      cards: [makeCard('2', 'clubs')],
    },
    {
      title: 'A little memory goes a long way.',
      body: `Notice which suits people can’t follow. A low lead can lure a higher card out of the next player — just before someone else makes a ${t.cut.toLowerCase()}.`,
      note: 'Shed high cards safely, watch small hands, and leave a little room for mischief.',
      cards: [
        makeCard('2', 'hearts'),
        makeCard('7', 'hearts'),
        makeCard('A', 'clubs'),
      ],
    },
  ];
  const lesson = lessons[step];
  return (
    <div className="tutorial">
      <div className="lesson-counter">
        THE BASICS <span>{String(step + 1).padStart(2, '0')} / 08</span>
      </div>
      <div className="lesson-cards">
        {lesson.cards.map((card, i) => (
          <div
            key={`${step}-${card.id}`}
            style={{
              transform: `rotate(${(i - (lesson.cards.length - 1) / 2) * 7}deg)`,
            }}
          >
            <PlayingCard card={card} />
            {(step === 3 || step === 5) && i === 3 && (
              <span className="example-cut">{t.cut}</span>
            )}
            {step === 5 && i === 2 && (
              <span className="example-winner">
                <Check size={12} />
                Takes pile
              </span>
            )}
          </div>
        ))}
      </div>
      <h3>{lesson.title}</h3>
      <p>{lesson.body}</p>
      <div className="lesson-note">
        <Lightbulb size={19} />
        <span>{lesson.note}</span>
      </div>
      <div className="tutorial-pagination">
        <button
          className="icon-button"
          aria-label="Previous lesson"
          onClick={() => setStep((previous) => previous - 1)}
          disabled={step === 0}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="lesson-dots">
          {lessons.map((_, i) => (
            <button
              key={i}
              className={i === step ? 'active' : ''}
              onClick={() => setStep(i)}
              aria-label={`Lesson ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
            />
          ))}
        </div>
        <button
          className="icon-button"
          aria-label="Next lesson"
          onClick={() => setStep((previous) => previous + 1)}
          disabled={step === 7}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
