import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

const BallJumpGame = () => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, gameover
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [ballPosition, setBallPosition] = useState(300);
  const [obstacles, setObstacles] = useState([]);
  const [gameSpeed, setGameSpeed] = useState(5);
  
  const gameLoopRef = useRef(null);
  const obstacleTimerRef = useRef(null);
  const scoreTimerRef = useRef(null);
  const isJumpingRef = useRef(false);
  
  const GROUND_LEVEL = 300;
  const BALL_SIZE = 50;
  const JUMP_HEIGHT = 150; // Maximum jump height
  const JUMP_SPEED = 8; // Speed of jump animation
  const FALL_SPEED = 8; // Speed of falling animation
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_HEIGHT = 50;

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ballJumpHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Handle spacebar jump
  const handleJump = useCallback(() => {
    if (gameState === 'ready') {
      startGame();
    } else if (gameState === 'playing' && !isJumpingRef.current) {
      isJumpingRef.current = true;
    } else if (gameState === 'gameover') {
      restartGame();
    }
  }, [gameState]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleJump]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setBallPosition(GROUND_LEVEL);
    setObstacles([]);
    setGameSpeed(5);
    isJumpingRef.current = false;
  };

  const restartGame = () => {
    startGame();
  };

  // Game loop - ball physics
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameLoopRef.current = setInterval(() => {
      setBallPosition(prev => {
        if (isJumpingRef.current) {
          // Jump up to maximum height
          const targetHeight = GROUND_LEVEL - JUMP_HEIGHT;
          if (prev > targetHeight) {
            return Math.max(prev - JUMP_SPEED, targetHeight);
          } else {
            // Reached top, start falling
            isJumpingRef.current = false;
            return prev;
          }
        } else {
          // Fall back down
          if (prev < GROUND_LEVEL) {
            return Math.min(prev + FALL_SPEED, GROUND_LEVEL);
          }
          return GROUND_LEVEL;
        }
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState]);

  // Obstacle generation
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnObstacle = () => {
      const newObstacle = {
        id: Date.now(),
        x: 800,
        height: OBSTACLE_HEIGHT,
      };
      setObstacles(prev => [...prev, newObstacle]);
    };

    obstacleTimerRef.current = setInterval(spawnObstacle, 2000);
    return () => clearInterval(obstacleTimerRef.current);
  }, [gameState]);

  // Move obstacles and check collision
  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveObstacles = setInterval(() => {
      setObstacles(prev => {
        const updated = prev
          .map(obs => ({ ...obs, x: obs.x - gameSpeed }))
          .filter(obs => obs.x > -OBSTACLE_WIDTH);

        // Collision detection
        const ballLeft = 100;
        const ballRight = ballLeft + BALL_SIZE;
        const ballTop = ballPosition;
        const ballBottom = ballPosition + BALL_SIZE;

        for (let obs of updated) {
          const obsLeft = obs.x;
          const obsRight = obs.x + OBSTACLE_WIDTH;
          const obsTop = GROUND_LEVEL + BALL_SIZE - obs.height;
          const obsBottom = GROUND_LEVEL + BALL_SIZE;

          if (
            ballRight > obsLeft &&
            ballLeft < obsRight &&
            ballBottom > obsTop &&
            ballTop < obsBottom
          ) {
            gameOver();
            return prev;
          }
        }

        return updated;
      });
    }, 1000 / 60);

    return () => clearInterval(moveObstacles);
  }, [gameState, gameSpeed, ballPosition]);

  // Score increase
  useEffect(() => {
    if (gameState !== 'playing') return;

    scoreTimerRef.current = setInterval(() => {
      setScore(prev => {
        const newScore = prev + 1;
        
        // Increase difficulty every 100 points
        if (newScore % 100 === 0) {
          setGameSpeed(prevSpeed => Math.min(prevSpeed + 0.5, 12));
        }
        
        return newScore;
      });
    }, 100);

    return () => clearInterval(scoreTimerRef.current);
  }, [gameState]);

  const gameOver = () => {
    setGameState('gameover');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('ballJumpHighScore', score.toString());
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="score-display">
          <div className="score-item">
            <span className="score-label">Score</span>
            <span className="score-value" data-testid="current-score">{score}</span>
          </div>
          <div className="score-item">
            <span className="score-label">High Score</span>
            <span className="score-value" data-testid="high-score">{highScore}</span>
          </div>
        </div>
      </div>

      <div className="game-canvas" data-testid="game-canvas">
        {/* Ball */}
        <div
          className="ball"
          data-testid="game-ball"
          style={{
            bottom: `${GROUND_LEVEL - ballPosition + BALL_SIZE}px`,
          }}
        />

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            className="obstacle"
            data-testid="game-obstacle"
            style={{
              left: `${obs.x}px`,
              height: `${obs.height}px`,
            }}
          />
        ))}

        {/* Ground */}
        <div className="ground" />

        {/* Start Screen */}
        {gameState === 'ready' && (
          <div className="game-overlay" data-testid="start-screen">
            <div className="overlay-content">
              <h1 className="game-title">Ball Jump</h1>
              <p className="game-instruction">Press <kbd>SPACE</kbd> to Start & Jump</p>
              <button 
                className="start-button"
                data-testid="start-button"
                onClick={handleJump}
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="game-overlay" data-testid="gameover-screen">
            <div className="overlay-content">
              <h1 className="game-over-title">Game Over!</h1>
              <div className="final-score">
                <p className="final-score-label">Your Score</p>
                <p className="final-score-value" data-testid="final-score">{score}</p>
              </div>
              {score === highScore && score > 0 && (
                <p className="new-record">🎉 New High Score!</p>
              )}
              <button 
                className="restart-button"
                data-testid="restart-button"
                onClick={restartGame}
              >
                <RotateCcw size={20} />
                Play Again
              </button>
              <p className="game-instruction-small">or press <kbd>SPACE</kbd></p>
            </div>
          </div>
        )}
      </div>

      <div className="game-controls">
        <div className="control-hint">
          <kbd>SPACE</kbd>
          <span>Jump</span>
        </div>
      </div>
    </div>
  );
};

export default BallJumpGame;
