import React, { useEffect, useRef, useState } from 'react';
import { Sword, Play, Timer } from 'lucide-react';
import { Comment, Round, Particle, PowerUp } from './types';
import {
  generateComment,
  generateRound,
  createExplosion,
  generatePowerUp,
} from './utils';
import appleLogo from './assets/apple-logo.svg';

const GAME_DURATION = 60; // 60 seconds

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [mouseTrail, setMouseTrail] = useState<{ x: number; y: number }[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [remainingComments, setRemainingComments] = useState(0);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [powerUpActive, setPowerUpActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [hasGoldenComment, setHasGoldenComment] = useState(false);
  const powerUpTimeoutRef = useRef<number>();
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect for game timer
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      gameTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            if (gameTimerRef.current) {
              clearInterval(gameTimerRef.current);
            }
            setIsPlaying(false);
            setGameOver(true);
            return 0;
          }
          return newTime;
        });
      }, 100);

      return () => {
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
        }
      };
    }
  }, [isPlaying]);

  const startGame = () => {
    // Clear any existing timer
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }

    setScore(0);
    setGameOver(false);
    setComments([]);
    setParticles([]);
    setPowerUps([]);
    setCurrentRound(generateRound(1));
    setTimeRemaining(GAME_DURATION);
    setScoreMultiplier(1);
    setPowerUpActive(false);
    setHasGoldenComment(false);
    setIsPlaying(true); // This will trigger the timer effect
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;
    let lastSpawnTime = 0;

    // Load Apple logo
    const appleImage = new Image();
    appleImage.src = appleLogo;

    const animate = (timestamp: number) => {
      if (!isPlaying) {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new comments if in a round
      if (
        currentRound &&
        isPlaying &&
        timestamp - lastSpawnTime > currentRound.interval
      ) {
        if (remainingComments > 0) {
          // Only spawn golden comment if we don't have one and with 5% chance
          const shouldSpawnGolden = !hasGoldenComment && Math.random() < 0.05;
          const newComment = generateComment(
            canvas.width,
            currentRound.speed * (powerUpActive ? 0.5 : 1),
            shouldSpawnGolden
          );

          if (shouldSpawnGolden) {
            setHasGoldenComment(true);
          }

          setComments((prev) => [...prev, newComment]);

          // 20% chance to spawn a power-up with the comment
          if (Math.random() < 0.05) {
            setPowerUps((prev) => [
              ...prev,
              generatePowerUp(newComment.x + 120, newComment.y, 2),
            ]);
          }

          setRemainingComments((prev) => prev - 1);
          lastSpawnTime = timestamp;
        }
      }

      // Update and draw particles
      setParticles((prev) =>
        prev
          .filter((particle) => particle.alpha > 0.1)
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.dx,
            y: particle.y + particle.dy,
            dy: particle.dy + 0.2,
            alpha: particle.alpha * 0.95,
            rotation: particle.rotation + particle.rotationSpeed,
          }))
      );

      particles.forEach((particle) => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.font = `${particle.size}px sans-serif`;
        ctx.fillStyle = '#2563eb';
        ctx.fillText(
          particle.text,
          -ctx.measureText(particle.text).width / 2,
          0
        );
        ctx.restore();
      });

      // Update and draw power-ups
      setPowerUps((prev) =>
        prev
          .filter(
            (powerUp) => !powerUp.sliced && powerUp.y < canvas.height + 50
          )
          .map((powerUp) => ({
            ...powerUp,
            y: powerUp.y + powerUp.speed,
            rotation: powerUp.rotation + 0.02,
          }))
      );

      powerUps.forEach((powerUp) => {
        if (!powerUp.sliced) {
          ctx.save();
          ctx.translate(powerUp.x + 24, powerUp.y + 24);
          ctx.rotate(powerUp.rotation);
          ctx.scale(powerUp.scale, powerUp.scale);
          ctx.drawImage(appleImage, -24, -24, 48, 48);
          ctx.restore();
        }
      });

      // Draw and update comments
      setComments((prev) => {
        const updatedComments = prev
          .filter((comment) => comment.y < canvas.height + 100)
          .map((comment) => ({
            ...comment,
            y: comment.y + comment.speed,
          }));

        // Check if round is complete
        if (
          currentRound &&
          updatedComments.length === 0 &&
          remainingComments === 0
        ) {
          setCurrentRound(generateRound(currentRound.number + 1));
          setRemainingComments(currentRound.commentsCount + 1);
          setHasGoldenComment(false); // Reset golden comment for new round
        }

        return updatedComments;
      });

      comments.forEach((comment) => {
        if (!comment.sliced) {
          ctx.save();
          ctx.fillStyle = comment.isGolden
            ? 'rgba(255, 223, 0, 0.9)'
            : 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = comment.isGolden ? '#fbbf24' : '#2563eb';
          ctx.lineWidth = 2;

          // Draw comment bubble
          ctx.beginPath();
          ctx.roundRect(comment.x, comment.y, 200, 60, 10);
          ctx.fill();
          ctx.stroke();

          // Draw tail
          ctx.beginPath();
          ctx.moveTo(comment.x + 20, comment.y + 60);
          ctx.lineTo(comment.x + 30, comment.y + 75);
          ctx.lineTo(comment.x + 40, comment.y + 60);
          ctx.fill();
          ctx.stroke();

          // Draw text
          ctx.fillStyle = comment.isGolden ? '#92400e' : '#1e293b';
          ctx.font = comment.isGolden
            ? 'bold 14px sans-serif'
            : '14px sans-serif';
          ctx.fillText(comment.text, comment.x + 10, comment.y + 35, 180);
          ctx.restore();
        }
      });

      // Draw mouse trail
      if (mouseTrail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)';
        ctx.lineWidth = 3;
        ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
        mouseTrail.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMouseTrail((prev) => {
        const newTrail = [...prev, { x, y }];
        if (newTrail.length > 10) newTrail.shift();
        return newTrail;
      });

      // Check for collisions with comments
      comments.forEach((comment) => {
        if (
          !comment.sliced &&
          x > comment.x &&
          x < comment.x + 200 &&
          y > comment.y &&
          y < comment.y + 60
        ) {
          comment.sliced = true;
          setScore((prev) => prev + 10 * scoreMultiplier);
          setParticles((prev) => [
            ...prev,
            ...createExplosion(comment.x, comment.y, comment.text),
          ]);

          // If it's a golden comment, slice all other comments in the wave
          if (comment.isGolden) {
            setComments((prev) =>
              prev.map((c) => ({
                ...c,
                sliced: true,
              }))
            );
            setScore((prev) => prev + 50 * scoreMultiplier); // Bonus points for golden comment
          }
        }
      });

      // Check for collisions with power-ups
      powerUps.forEach((powerUp) => {
        if (
          !powerUp.sliced &&
          x > powerUp.x &&
          x < powerUp.x + 48 &&
          y > powerUp.y &&
          y < powerUp.y + 48
        ) {
          powerUp.sliced = true;
          setScoreMultiplier(2);
          setPowerUpActive(true);

          // Clear existing timeout if any
          if (powerUpTimeoutRef.current) {
            window.clearTimeout(powerUpTimeoutRef.current);
          }

          // Reset power-up after 10 seconds
          powerUpTimeoutRef.current = window.setTimeout(() => {
            setScoreMultiplier(1);
            setPowerUpActive(false);
          }, 10000);
        }
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (powerUpTimeoutRef.current) {
        window.clearTimeout(powerUpTimeoutRef.current);
      }
    };
  }, [
    comments,
    currentRound,
    isPlaying,
    remainingComments,
    particles,
    powerUps,
    scoreMultiplier,
    powerUpActive,
    hasGoldenComment,
  ]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-none" />

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="bg-white/90 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  Score: {score}
                </p>
                {currentRound && (
                  <p className="text-lg text-blue-600">
                    Round: {currentRound.number}
                  </p>
                )}
                {powerUpActive && (
                  <p className="text-sm text-green-600 font-medium">
                    2x Points Active!
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
                <Timer className="w-6 h-6" />
                {Math.ceil(timeRemaining)}s
              </div>
            </div>
          </div>
          {!isPlaying ? (
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-white/90 rounded-lg px-6 py-3 shadow-lg hover:bg-white/100 transition-colors"
            >
              <Play className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-medium text-blue-600">
                {gameOver ? 'Play Again' : 'Start Game'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white/90 rounded-lg px-4 py-2 shadow-lg">
              <Sword className="w-6 h-6 text-blue-600" />
              <p className="text-lg font-medium">Slice the comments!</p>
            </div>
          )}
        </div>
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-8 shadow-xl text-center">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">
              Game Over!
            </h2>
            <p className="text-2xl text-gray-700 mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-6 py-3 mx-auto hover:bg-blue-700 transition-colors"
            >
              <Play className="w-6 h-6" />
              <span className="text-lg font-medium">Play Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
