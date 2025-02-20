const SILLY_COMMENTS = [
  'Meglio i tablet android di iPad',
  'Il PC Gaming soppianterà PS5',
  "l'altezza media dell'uomo in israele è 177cm, quindi tu al massimo mi fai un bocchino",
  "si che l'ho giocato bestia di satana, e l'ho pure finito",
  'Zitto mongoloide',
  'Win Win',
  'bucato preservativo',
  'Offtopic',
  'Vai a fare in culo giorgio',
  'Atmosfera ottimamente resa su schermo',
];

export const generateComment = (
  maxWidth: number,
  speed: number,
  isGolden: boolean = false
): Comment => ({
  x: Math.random() * (maxWidth - 200),
  y: -100,
  text: isGolden
    ? 'Maestro @Intower'
    : SILLY_COMMENTS[Math.floor(Math.random() * SILLY_COMMENTS.length)],
  speed: speed + Math.random() * speed, // velocità casuale tra speed e speed*2
  sliced: false,
  isGolden,
});

export const generateRound = (roundNumber: number): Round => ({
  number: roundNumber,
  commentsCount: 5 + Math.floor(roundNumber / 2), // Increase comments per round
  speed: 2 + roundNumber * 0.5, // Increase speed each round
  interval: Math.max(1000 - roundNumber * 100, 400), // Decrease interval (min 400ms)
});

export const createExplosion = (
  x: number,
  y: number,
  text: string,
  isGolden: boolean = false
): Particle[] => {
  const particles: Particle[] = [];
  const fragments = text.split(' ');

  fragments.forEach((fragment, i) => {
    const angle = (Math.PI * 2 * i) / fragments.length;
    const speed = 5 + Math.random() * 5;

    particles.push({
      x: x + 100, // Center of the comment
      y: y + 30,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 2, // Slight upward bias
      size: 14 + Math.random() * 4,
      text: fragment,
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    });
  });

  return particles;
};

export const generatePowerUp = (
  x: number,
  y: number,
  speed: number
): PowerUp => ({
  x,
  y,
  speed,
  sliced: false,
  scale: 1,
  rotation: Math.random() * Math.PI * 2,
});
