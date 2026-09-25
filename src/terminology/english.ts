export const english = {
  gameName: 'Last Card',
  heritage: 'A CLASSIC CARD GAME, REIMAGINED',
  origin: 'Inspired by a Kerala classic',
  cut: 'Cut',
  lastPlayer: 'Last player',
  round: 'Round',
  winner: 'Winner',
  opening: 'A♠ starts the game',
  cleanRound: 'Clean round',
  discarded: 'Cards discarded',
  pickup: (name: string) => `${name} takes the cards`,
  turn: (name: string) => `${name}’s turn`,
  pass: (name: string) => `Pass the device to ${name}`,
  nextLead: (name: string) => `${name} leads next`,
};
export type Terminology = typeof english;
