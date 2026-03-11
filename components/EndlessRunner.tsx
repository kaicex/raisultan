'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

type HazardType = 'bug' | 'deadline' | 'research' | 'course' | 'mentor';
type GiftType = 'redesign' | 'premium' | 'claude' | 'dota';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: HazardType;
}

interface Gift {
  x: number;
  y: number;
  width: number;
  height: number;
  type: GiftType;
  bob: number;
}

const hazardLabels: Record<HazardType, string> = {
  bug: 'БАГ',
  deadline: 'ДЕДЛАЙН',
  research: 'РЕСЕРЧ',
  course: 'КУРС',
  mentor: 'МЕНТОРСТВО',
};

const giftLabels: Record<GiftType, string> = {
  redesign: 'RD',
  premium: 'TG',
  claude: 'CC',
  dota: 'D2',
};

const giftTitles: Record<GiftType, string> = {
  redesign: 'Дизайн-фидбек на твой продукт от Кая',
  premium: 'Telegram Premium',
  claude: 'Claude Code Max',
  dota: '100 часов Доты со мной',
};

const giftColors: Record<GiftType, string> = {
  redesign: '#f59e0b',
  premium: '#38bdf8',
  claude: '#34d399',
  dota: '#f97316',
};

const unlockedGiftOrder: GiftType[] = ['redesign', 'premium', 'claude', 'dota'];

const progressMessages = [
  'Праксис набирает ход. Главное не отчаиваться.',
  'Да лан, можно успеть если сильно хочется.',
  'Ты уже разогнался. Теперь просто не теряй темп.',
  'Claude Max рядом. Погнали дальше, брат.',
  'Еще немного и Праксис будет у всех на радаре.',
  'Молодец, брат. Мой же брат.',
  'Вот это темп. Так и надо.',
  'Красавчик. Еще чуть-чуть и долетишь.',
  'Нормально идешь. Не сбавляй.',
];

export default function EndlessRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  const [message, setMessage] = useState('Помоги Праксису залететь. Внутри есть подарки, но сначала добеги до них.');

  const gameRef = useRef({
    player: {
      x: 100,
      y: 0,
      width: 44,
      height: 56,
      velocityY: 0,
      isJumping: false,
      rotation: 0,
    },
    obstacles: [] as Obstacle[],
    gifts: [] as Gift[],
    particles: [] as Particle[],
    ground: 400,
    gravity: 0.72,
    jumpStrength: -17,
    gameSpeed: 6.1,
    obstacleTimer: 0,
    obstacleInterval: 92,
    giftTimer: 0,
    giftInterval: 240,
    score: 0,
    giftsCollected: 0,
    animationFrame: 0,
    completedGiftSet: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = Math.min(1180, window.innerWidth - 24);
      canvas.height = 540;
      gameRef.current.ground = canvas.height - 110;
      gameRef.current.player.y = gameRef.current.ground - gameRef.current.player.height;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const savedHighScore = localStorage.getItem('praxisRunHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    let animationId: number;

    const drawCard = (x: number, y: number, width: number, height: number, colorTop: string, colorBottom: string) => {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, colorTop);
      gradient.addColorStop(1, colorBottom);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 14);
      ctx.fill();
    };

    const drawGift = (gift: Gift) => {
      const bobOffset = Math.sin(gameRef.current.animationFrame * 0.08 + gift.bob) * 6;
      const drawY = gift.y + bobOffset;
      const color = giftColors[gift.type];

      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.ellipse(gift.x + gift.width / 2, gameRef.current.ground + 10, gift.width / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      drawCard(gift.x, drawY, gift.width, gift.height, color, '#111827');
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(giftLabels[gift.type], gift.x + gift.width / 2, drawY + 26);

      ctx.font = '11px Arial';
      ctx.fillStyle = 'rgba(248,250,252,0.8)';
      ctx.fillText('подарок', gift.x + gift.width / 2, drawY + 43);
      ctx.textAlign = 'left';
    };

    const spawnGiftParticles = (x: number, y: number, type: GiftType) => {
      const color = giftColors[type];
      for (let i = 0; i < 14; i++) {
        gameRef.current.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * -5,
          life: 40,
          color,
        });
      }
    };

    const gameLoop = () => {
      const game = gameRef.current;

      if (gameState !== 'playing') {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const { player, obstacles, gifts, particles, ground, gravity, gameSpeed } = game;

      game.animationFrame++;

      const backgroundGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      backgroundGradient.addColorStop(0, '#08111f');
      backgroundGradient.addColorStop(0.45, '#132238');
      backgroundGradient.addColorStop(1, '#1d3b2a');
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 22; i++) {
        const x = (i * 137 + game.animationFrame * 0.35) % canvas.width;
        const y = 30 + ((i * 71) % (canvas.height - 220));
        ctx.fillStyle = `rgba(148, 163, 184, ${0.12 + ((i % 5) * 0.04)})`;
        ctx.beginPath();
        ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(16, 185, 129, 0.09)';
      for (let i = 0; i < canvas.width; i += 110) {
        const offset = (game.animationFrame * 1.2) % 110;
        ctx.fillRect(i - offset, 72, 60, 180);
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, ground, canvas.width, canvas.height - ground);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(canvas.width, ground);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 54) {
        const offset = (game.animationFrame * gameSpeed) % 54;
        ctx.beginPath();
        ctx.moveTo(i - offset, ground);
        ctx.lineTo(i - offset - 18, canvas.height);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(18, 18, 260, 70, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Praxis Run', 34, 46);
      ctx.font = '13px Arial';
      ctx.fillStyle = 'rgba(226,232,240,0.72)';
      ctx.fillText('Цель: сделать Praxis популярным', 34, 68);

      player.velocityY += gravity;
      player.y += player.velocityY;

      if (player.y >= ground - player.height) {
        player.y = ground - player.height;
        player.velocityY = 0;
        player.isJumping = false;
        player.rotation = 0;
      } else {
        player.rotation += 0.08;
      }

      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
      ctx.beginPath();
      ctx.ellipse(player.x + player.width / 2, ground + 7, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
      if (player.isJumping) {
        ctx.rotate(player.rotation);
      }

      const hoodieGradient = ctx.createLinearGradient(-18, -28, 18, 28);
      hoodieGradient.addColorStop(0, '#232634');
      hoodieGradient.addColorStop(1, '#05070d');
      ctx.fillStyle = hoodieGradient;
      ctx.beginPath();
      ctx.roundRect(-18, -24, 36, 42, 14);
      ctx.fill();

      ctx.fillStyle = '#e6c7b1';
      ctx.beginPath();
      ctx.arc(0, -23, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#171717';
      ctx.beginPath();
      ctx.ellipse(0, -31, 15, 11, 0, Math.PI, 0, true);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-13, -29);
      ctx.quadraticCurveTo(-18, -20, -12, -10);
      ctx.lineTo(-8, -21);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(13, -29);
      ctx.quadraticCurveTo(18, -20, 12, -10);
      ctx.lineTo(8, -21);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -24, 1.8, 0, Math.PI * 2);
      ctx.arc(4, -24, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#96614c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4, -15);
      ctx.quadraticCurveTo(0, -12.5, 4, -15);
      ctx.stroke();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 18);
      ctx.lineTo(-14, 28);
      ctx.moveTo(10, 18);
      ctx.lineTo(14, 28);
      ctx.stroke();

      ctx.restore();

      game.obstacleTimer++;
      if (game.obstacleTimer > game.obstacleInterval) {
        game.obstacleTimer = 0;
        const types: HazardType[] = ['bug', 'deadline', 'research', 'course', 'mentor'];
        const type = types[Math.floor(Math.random() * types.length)];

        let height = 46;
        let width = 54;

        if (type === 'deadline') {
          height = 56;
          width = 42;
        } else if (type === 'research') {
          height = 60;
          width = 72;
        } else if (type === 'course') {
          height = 68;
          width = 60;
        } else if (type === 'mentor') {
          height = 62;
          width = 76;
        }

        obstacles.push({
          x: canvas.width + 20,
          y: ground - height,
          width,
          height,
          type,
        });
      }

      game.giftTimer++;
      if (!game.completedGiftSet && game.giftTimer > game.giftInterval) {
        game.giftTimer = 0;
        const nextGift = unlockedGiftOrder[game.giftsCollected];
        if (nextGift) {
          gifts.push({
            x: canvas.width + 40,
            y: ground - 132,
            width: 58,
            height: 52,
            type: nextGift,
            bob: Math.random() * Math.PI * 2,
          });
        }
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= gameSpeed;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.28)';
        ctx.fillRect(obstacle.x + 3, ground + 5, obstacle.width, 10);

        if (obstacle.type === 'bug') {
          drawCard(obstacle.x, obstacle.y, obstacle.width, obstacle.height, '#ef4444', '#7f1d1d');
        } else if (obstacle.type === 'deadline') {
          drawCard(obstacle.x, obstacle.y, obstacle.width, obstacle.height, '#f97316', '#7c2d12');
        } else if (obstacle.type === 'research') {
          drawCard(obstacle.x, obstacle.y, obstacle.width, obstacle.height, '#334155', '#0f172a');
        } else if (obstacle.type === 'course') {
          drawCard(obstacle.x, obstacle.y, obstacle.width, obstacle.height, '#22c55e', '#14532d');
        } else if (obstacle.type === 'mentor') {
          drawCard(obstacle.x, obstacle.y, obstacle.width, obstacle.height, '#7c3aed', '#4c1d95');
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          hazardLabels[obstacle.type],
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height / 2 + 4
        );
        ctx.textAlign = 'left';

        if (
          player.x < obstacle.x + obstacle.width &&
          player.x + player.width > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + player.height > obstacle.y
        ) {
          for (let p = 0; p < 30; p++) {
            particles.push({
              x: player.x + player.width / 2,
              y: player.y + player.height / 2,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10 - 3,
              life: 60,
              color: ['#22c55e', '#f97316', '#38bdf8', '#e879f9'][Math.floor(Math.random() * 4)],
            });
          }

          setMessage(`${hazardLabels[obstacle.type]} мешает Праксису. Давай еще раз, брат.`);
          setGameState('gameOver');
          if (game.score > highScore) {
            setHighScore(game.score);
            localStorage.setItem('praxisRunHighScore', game.score.toString());
          }
        }

        if (obstacle.x + obstacle.width < 0) {
          obstacles.splice(i, 1);
          game.score += 10;
          setScore(game.score);

          if (game.score % 120 === 0) {
            game.gameSpeed += 0.5;
            game.obstacleInterval = Math.max(60, game.obstacleInterval - 4);
            setMessage(progressMessages[(game.score / 120 - 1) % progressMessages.length]);
          }
        }
      }

      for (let i = gifts.length - 1; i >= 0; i--) {
        const gift = gifts[i];
        gift.x -= gameSpeed * 0.92;
        drawGift(gift);

        if (
          player.x < gift.x + gift.width &&
          player.x + player.width > gift.x &&
          player.y < gift.y + gift.height &&
          player.y + player.height > gift.y
        ) {
          gifts.splice(i, 1);
          game.giftsCollected += 1;
          setGiftCount(game.giftsCollected);
          setMessage(`Открыто: ${giftTitles[gift.type]}`);
          spawnGiftParticles(gift.x + gift.width / 2, gift.y + gift.height / 2, gift.type);

          if (game.giftsCollected === unlockedGiftOrder.length) {
            game.completedGiftSet = true;
          }
          continue;
        }

        if (gift.x + gift.width < 0) {
          gifts.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.22;
        particle.life--;

        const alpha = particle.life / 60;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = Math.max(alpha, 0);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (particle.life <= 0) {
          particles.splice(i, 1);
        }
      }

      ctx.font = 'bold 34px Arial';
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.lineWidth = 6;
      ctx.strokeText(`${game.score}`, canvas.width - 120, 52);
      ctx.fillText(`${game.score}`, canvas.width - 120, 52);

      if (game.giftsCollected === unlockedGiftOrder.length && game.score >= 240) {
        setMessage('С днюхой, Райсултан. Праксис на подъеме. Выбери один подарок и скинь мне скрин.');
        if (game.score > highScore) {
          setHighScore(game.score);
          localStorage.setItem('praxisRunHighScore', game.score.toString());
        }
        setGameState('gameOver');
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [gameState, highScore]);

  const resetRun = () => {
    const game = gameRef.current;
    game.score = 0;
    game.giftsCollected = 0;
    game.completedGiftSet = false;
    game.obstacles = [];
    game.gifts = [];
    game.particles = [];
    game.gameSpeed = 6.1;
    game.obstacleInterval = 92;
    game.obstacleTimer = 0;
    game.giftTimer = 0;
    game.player.y = game.ground - game.player.height;
    game.player.velocityY = 0;
    game.player.rotation = 0;
    game.player.isJumping = false;
    setScore(0);
    setGiftCount(0);
    setMessage('Помоги Праксису залететь. Внутри есть подарки, но сначала добеги до них.');
  };

  const handleJump = () => {
    const game = gameRef.current;

    if (gameState === 'start') {
      resetRun();
      setGameState('playing');
      return;
    }

    if (gameState === 'playing') {
      if (!game.player.isJumping) {
        game.player.velocityY = game.jumpStrength;
        game.player.isJumping = true;
        for (let i = 0; i < 8; i++) {
          game.particles.push({
            x: game.player.x + game.player.width / 2,
            y: game.player.y + game.player.height,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 2,
            life: 28,
            color: '#22c55e',
          });
        }
      }
      return;
    }

    if (gameState === 'gameOver') {
      setGameState('start');
      resetRun();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const unlockedGifts = unlockedGiftOrder.slice(0, giftCount);
  const didWin = giftCount === unlockedGiftOrder.length && score >= 240;

  return (
    <div className="flex w-full max-w-[1220px] flex-col items-center justify-center gap-5 px-3 py-6">
      <div className="text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-emerald-300/80">Днюха билд для Райсултана</p>
        <h1 className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-5xl font-black text-transparent md:text-7xl">
          Praxis Run
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-base text-slate-300 md:text-lg">
          Ты строишь Праксис. Нужно допрыгать до популярности, пережить баги и дедлайны. Внутри
          есть подарки, но сначала добеги до финиша.
        </p>
      </div>

      <div className="w-full rounded-[28px] border border-white/10 bg-slate-950/70 p-3 shadow-[0_20px_80px_rgba(8,15,28,0.45)] backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="min-w-[240px]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Бриф</p>
            <p className="mt-1 text-sm text-slate-300 md:text-base">{message}</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/70">Хайп Праксиса</p>
              <p className="mt-1 text-2xl font-black text-white">{score}</p>
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber-100/70">Лучший забег</p>
              <p className="mt-1 text-2xl font-black text-white">{highScore}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[22px] border border-emerald-300/20 bg-slate-950">
            <canvas
              ref={canvasRef}
              onClick={handleJump}
              onTouchStart={(e) => {
                e.preventDefault();
                handleJump();
              }}
              className="block cursor-pointer"
              style={{ maxWidth: '100%', touchAction: 'none' }}
            />

            {gameState === 'start' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.28),transparent_45%),rgba(2,6,23,0.78)]">
                <div className="max-w-md text-center text-white">
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">Миссия</p>
                  <h2 className="mt-3 text-4xl font-black">Сделай Праксис популярным</h2>
                  <p className="mt-4 text-slate-300">
                    Перепрыгивай баги, дедлайны, плохой UX и скоуп. Внутри тебя ждут подарки, но
                    заранее не палю. И помни:
                    главное не отчаиваться.
                  </p>
                  <p className="mt-4 text-sm text-slate-400">Подсказка: не все можно решить тем, что покрасить в розовый.</p>
                  <p className="mt-6 text-sm text-slate-400">Нажми SPACE / W / ↑ или тапни по экрану, чтобы начать.</p>
                  {highScore > 0 && (
                    <p className="mt-4 text-lg font-semibold text-amber-300">Лучший хайп Праксиса: {highScore}</p>
                  )}
                </div>
              </div>
            )}

            {gameState === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(2,6,23,0.82)] p-4">
                <div className="w-full max-w-lg rounded-[26px] border border-white/10 bg-slate-950/95 p-7 text-center shadow-2xl">
                  <p className="text-sm uppercase tracking-[0.28em] text-emerald-300/80">
                    {didWin ? 'Победа' : 'Забег прерван'}
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-white">
                    {didWin ? 'С днюхой, Райсултан' : 'Праксису нужен еще один забег'}
                  </h2>
                  <p className="mt-4 text-slate-300">{message}</p>
                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Хайп Праксиса</p>
                      <p className="mt-2 text-3xl font-black text-white">{score}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">Лучший забег</p>
                      <p className="mt-2 text-3xl font-black text-white">{highScore}</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Выбери один подарок</p>
                    <div className="mt-3 grid gap-2">
                      {unlockedGifts.length > 0 ? (
                        unlockedGifts.map((gift) => (
                          <div
                            key={gift}
                            className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-200"
                          >
                            {giftTitles[gift]}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Пока ничего не открылось. Соберись и прыгай чище.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm text-slate-300">
                    <p>Напоминание:</p>
                    <p>Ты уже много вывез. Вывезешь и это.</p>
                    <p>Праксису нужен не идеальный старт, а твой темп.</p>
                    <p>Выбери один подарок и скинь мне скрин. Потом можно и в дотку.</p>
                  </div>
                  <p className="mt-6 text-sm text-slate-400">Нажми SPACE или тапни, чтобы начать заново.</p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
