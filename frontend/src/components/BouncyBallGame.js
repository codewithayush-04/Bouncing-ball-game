import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, RotateCcw, Trophy, ArrowLeft, ArrowRight } from 'lucide-react';

const BouncyBallGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, levelComplete, gameOver
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalStars, setTotalStars] = useState(0);
  const [levelStars, setLevelStars] = useState(0);
  const [lives, setLives] = useState(3);
  
  const gameLoopRef = useRef(null);
  const keysPressed = useRef({});
  
  // Game physics constants
  const GRAVITY = 0.5;
  const BOUNCE_DAMPING = 0.7;
  const MOVE_SPEED = 5;
  const JUMP_FORCE = -10;
  
  // Game state
  const ballRef = useRef({
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    radius: 20,
    onGround: false
  });
  
  const starsRef = useRef([]);
  const platformsRef = useRef([]);
  const spikesRef = useRef([]);
  const finishRef = useRef({ x: 0, y: 0, width: 40, height: 60 });
  
  // Level designs
  const levels = [
    {
      name: "Level 1: The Beginning",
      platforms: [
        { x: 0, y: 550, width: 800, height: 50 }, // Ground
        { x: 200, y: 450, width: 150, height: 20 },
        { x: 450, y: 350, width: 150, height: 20 },
      ],
      stars: [
        { x: 270, y: 400, collected: false },
        { x: 520, y: 300, collected: false },
        { x: 650, y: 450, collected: false },
      ],
      spikes: [
        { x: 380, y: 530, width: 60, height: 20 },
      ],
      spawn: { x: 50, y: 400 },
      finish: { x: 720, y: 490 }
    },
    {
      name: "Level 2: The Gap",
      platforms: [
        { x: 0, y: 550, width: 250, height: 50 },
        { x: 550, y: 550, width: 250, height: 50 },
        { x: 150, y: 400, width: 100, height: 20 },
        { x: 350, y: 450, width: 100, height: 20 },
        { x: 550, y: 400, width: 100, height: 20 },
      ],
      stars: [
        { x: 190, y: 350, collected: false },
        { x: 390, y: 400, collected: false },
        { x: 590, y: 350, collected: false },
      ],
      spikes: [
        { x: 260, y: 530, width: 280, height: 20 },
      ],
      spawn: { x: 50, y: 400 },
      finish: { x: 720, y: 490 }
    },
    {
      name: "Level 3: The Tower",
      platforms: [
        { x: 0, y: 550, width: 800, height: 50 },
        { x: 100, y: 480, width: 120, height: 20 },
        { x: 580, y: 480, width: 120, height: 20 },
        { x: 100, y: 380, width: 120, height: 20 },
        { x: 580, y: 380, width: 120, height: 20 },
        { x: 340, y: 280, width: 120, height: 20 },
      ],
      stars: [
        { x: 150, y: 430, collected: false },
        { x: 630, y: 430, collected: false },
        { x: 150, y: 330, collected: false },
        { x: 630, y: 330, collected: false },
        { x: 390, y: 230, collected: false },
      ],
      spikes: [
        { x: 230, y: 530, width: 80, height: 20 },
        { x: 490, y: 530, width: 80, height: 20 },
      ],
      spawn: { x: 50, y: 400 },
      finish: { x: 720, y: 490 }
    }
  ];

  // Load level
  const loadLevel = useCallback((levelNum) => {
    if (levelNum > levels.length) {
      setGameState('gameComplete');
      return;
    }
    
    const level = levels[levelNum - 1];
    platformsRef.current = [...level.platforms];
    starsRef.current = level.stars.map(s => ({ ...s, collected: false }));
    spikesRef.current = [...level.spikes];
    finishRef.current = { ...level.finish, width: 40, height: 60 };
    
    ballRef.current = {
      x: level.spawn.x,
      y: level.spawn.y,
      vx: 0,
      vy: 0,
      radius: 20,
      onGround: false
    };
    
    setLevelStars(0);
    setGameState('playing');
  }, [levels]);

  // Start game
  const startGame = () => {
    setCurrentLevel(1);
    setTotalStars(0);
    setLives(3);
    loadLevel(1);
  };

  // Next level
  const nextLevel = () => {
    const nextLevelNum = currentLevel + 1;
    setCurrentLevel(nextLevelNum);
    loadLevel(nextLevelNum);
  };

  // Restart level
  const restartLevel = () => {
    loadLevel(currentLevel);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      
      if (gameState === 'menu' && e.key === ' ') {
        startGame();
      } else if (gameState === 'levelComplete' && e.key === ' ') {
        nextLevel();
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, currentLevel]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const ball = ballRef.current;
    
    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Apply controls
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
        ball.vx = -MOVE_SPEED;
      } else if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
        ball.vx = MOVE_SPEED;
      } else {
        ball.vx = 0;
      }
      
      // Jump
      if ((keysPressed.current[' '] || keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) && ball.onGround) {
        ball.vy = JUMP_FORCE;
        ball.onGround = false;
      }
      
      // Apply gravity
      ball.vy += GRAVITY;
      
      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      // Check platform collisions
      ball.onGround = false;
      platformsRef.current.forEach(platform => {
        if (
          ball.x + ball.radius > platform.x &&
          ball.x - ball.radius < platform.x + platform.width &&
          ball.y + ball.radius > platform.y &&
          ball.y + ball.radius < platform.y + platform.height + 10 &&
          ball.vy > 0
        ) {
          ball.y = platform.y - ball.radius;
          ball.vy *= -BOUNCE_DAMPING;
          if (Math.abs(ball.vy) < 1) {
            ball.vy = 0;
            ball.onGround = true;
          }
        }
      });
      
      // Check star collection
      starsRef.current.forEach(star => {
        if (!star.collected) {
          const dist = Math.sqrt((ball.x - star.x) ** 2 + (ball.y - star.y) ** 2);
          if (dist < ball.radius + 15) {
            star.collected = true;
            setLevelStars(prev => prev + 1);
            setTotalStars(prev => prev + 1);
          }
        }
      });
      
      // Check spike collision
      spikesRef.current.forEach(spike => {
        if (
          ball.x + ball.radius > spike.x &&
          ball.x - ball.radius < spike.x + spike.width &&
          ball.y + ball.radius > spike.y
        ) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState('gameOver');
            } else {
              restartLevel();
            }
            return newLives;
          });
        }
      });
      
      // Check finish
      const allStarsCollected = starsRef.current.every(s => s.collected);
      if (allStarsCollected &&
          ball.x + ball.radius > finishRef.current.x &&
          ball.x - ball.radius < finishRef.current.x + finishRef.current.width &&
          ball.y + ball.radius > finishRef.current.y
      ) {
        setGameState('levelComplete');
      }
      
      // Check fall off
      if (ball.y > canvas.height + 50) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('gameOver');
          } else {
            restartLevel();
          }
          return newLives;
        });
      }
      
      // Boundary check
      if (ball.x - ball.radius < 0) ball.x = ball.radius;
      if (ball.x + ball.radius > canvas.width) ball.x = canvas.width - ball.radius;
      
      // Draw platforms
      platformsRef.current.forEach(platform => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      });
      
      // Draw spikes
      spikesRef.current.forEach(spike => {
        ctx.fillStyle = '#DC143C';
        for (let i = 0; i < spike.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(spike.x + i, spike.y + spike.height);
          ctx.lineTo(spike.x + i + 10, spike.y);
          ctx.lineTo(spike.x + i + 20, spike.y + spike.height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#8B0000';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
      
      // Draw stars
      starsRef.current.forEach(star => {
        if (!star.collected) {
          ctx.save();
          ctx.translate(star.x, star.y);
          ctx.rotate(Date.now() / 500);
          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      });
      
      // Draw finish flag
      const allCollected = starsRef.current.every(s => s.collected);
      if (allCollected) {
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(finishRef.current.x, finishRef.current.y, finishRef.current.width, finishRef.current.height);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Fredoka';
        ctx.textAlign = 'center';
        ctx.fillText('🏁', finishRef.current.x + 20, finishRef.current.y + 35);
      }
      
      // Draw ball
      const ballGradient = ctx.createRadialGradient(
        ball.x - 5, ball.y - 5, 2,
        ball.x, ball.y, ball.radius
      );
      ballGradient.addColorStop(0, '#FFD93D');
      ballGradient.addColorStop(1, '#FF6B35');
      
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#FF4500';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(ball.x - 6, ball.y - 6, 6, 0, Math.PI * 2);
      ctx.fill();
    };
    
    gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    
    return () => clearInterval(gameLoopRef.current);
  }, [gameState]);

  return (
    <div className="bouncy-game-container">
      {/* HUD */}
      <div className="game-hud">
        <div className="hud-item">
          <Star size={20} fill="#FFD700" stroke="#FFA500" />
          <span data-testid="stars-collected">{levelStars}/{starsRef.current.length}</span>
        </div>
        <div className="hud-item">
          <Trophy size={20} fill="#FFD700" stroke="#FFA500" />
          <span data-testid="total-stars">{totalStars}</span>
        </div>
        <div className="hud-item level-display">
          <span data-testid="current-level">Level {currentLevel}</span>
        </div>
        <div className="hud-item">
          <span>❤️ × {lives}</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="canvas-wrapper">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          data-testid="game-canvas"
        />
        
        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="game-overlay" data-testid="menu-screen">
            <div className="overlay-content">
              <h1 className="bouncy-title">Bouncy Ball</h1>
              <p className="game-subtitle">Collect all stars and reach the finish!</p>
              <div className="controls-info">
                <div className="control-row">
                  <kbd>←</kbd><kbd>→</kbd> or <kbd>A</kbd><kbd>D</kbd>
                  <span>Move</span>
                </div>
                <div className="control-row">
                  <kbd>SPACE</kbd> or <kbd>↑</kbd>
                  <span>Jump</span>
                </div>
              </div>
              <button 
                className="start-button"
                data-testid="start-button"
                onClick={startGame}
              >
                Start Game
              </button>
              <p className="hint-text">Press <kbd>SPACE</kbd> to start</p>
            </div>
          </div>
        )}
        
        {/* Level Complete Overlay */}
        {gameState === 'levelComplete' && (
          <div className="game-overlay" data-testid="level-complete-screen">
            <div className="overlay-content">
              <h1 className="complete-title">Level Complete! 🎉</h1>
              <div className="stats-box">
                <div className="stat-item">
                  <Star size={32} fill="#FFD700" stroke="#FFA500" />
                  <span className="stat-value">{levelStars}</span>
                  <span className="stat-label">Stars Collected</span>
                </div>
              </div>
              {currentLevel < levels.length ? (
                <>
                  <button 
                    className="next-button"
                    data-testid="next-level-button"
                    onClick={nextLevel}
                  >
                    Next Level →
                  </button>
                  <p className="hint-text">Press <kbd>SPACE</kbd> for next level</p>
                </>
              ) : (
                <>
                  <h2 className="congrats-text">🏆 You Won! 🏆</h2>
                  <p className="final-stats">Total Stars: {totalStars}</p>
                  <button 
                    className="restart-button"
                    data-testid="play-again-button"
                    onClick={startGame}
                  >
                    <RotateCcw size={20} />
                    Play Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Game Over Overlay */}
        {gameState === 'gameOver' && (
          <div className="game-overlay" data-testid="gameover-screen">
            <div className="overlay-content">
              <h1 className="game-over-title">Game Over</h1>
              <p className="final-stats">You collected {totalStars} stars!</p>
              <button 
                className="restart-button"
                data-testid="restart-button"
                onClick={startGame}
              >
                <RotateCcw size={20} />
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Hints */}
      <div className="control-hints">
        <div className="hint-group">
          <ArrowLeft size={16} />
          <ArrowRight size={16} />
          <span>Move</span>
        </div>
        <div className="hint-group">
          <kbd>SPACE</kbd>
          <span>Jump</span>
        </div>
      </div>
    </div>
  );
};

export default BouncyBallGame;
