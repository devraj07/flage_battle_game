import React, { useEffect, useRef } from 'react';
import { Player, FlagEntity, Particle } from '../types';
import { INITIAL_RADIUS, MAX_SPEED, MIN_SPEED, WINNER_RADIUS_GAIN } from '../constants';

interface ArenaProps {
  players: Player[];
  onGameOver: (winner: Player) => void;
  isPlaying: boolean;
}

const Arena: React.FC<ArenaProps> = ({ players, onGameOver, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable game state for performance
  const entitiesRef = useRef<FlagEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const shakeIntensityRef = useRef<number>(0);

  // Sound effects stub
  const playPop = () => { /* oscillator logic could go here */ };
  const playHit = () => { /* simpler hit sound */ };

  const spawnParticles = (x: number, y: number, color: string, count: number, speedMult: number = 1) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (Math.random() * 4 + 2) * speedMult;
          const isSpark = Math.random() > 0.7;
          
          particlesRef.current.push({
              x: x,
              y: y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              color: isSpark ? '#fbbf24' : color,
              size: Math.random() * 4 + 2
          });
      }
  };

  const initGame = () => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    // Arena is slightly smaller than the smallest dimension
    const arenaRadius = Math.min(width, height) / 2 - 20;

    entitiesRef.current = players.map((player) => {
      // Spawn within a safe circle
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (arenaRadius * 0.6); 
      
      return {
        id: player.id,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        vx: (Math.random() - 0.5) * MAX_SPEED * 2,
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
        radius: INITIAL_RADIUS,
        mass: 1,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        player,
        isDead: false,
        scale: 0,
        hp: 100,
        maxHp: 100,
        lastHitTime: 0
      };
    });

    particlesRef.current = [];
    shakeIntensityRef.current = 0;
  };

  useEffect(() => {
    if (isPlaying) {
      initGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeObserver = new ResizeObserver(() => {
        if(containerRef.current && canvasRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
        }
    });
    resizeObserver.observe(containerRef.current);

    // Game Loop
    const render = (time: number) => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const arenaRadius = Math.min(width, height) / 2 - 20;

      // 0. Screen Shake Logic
      if (shakeIntensityRef.current > 0) {
          const dx = (Math.random() - 0.5) * shakeIntensityRef.current * 2;
          const dy = (Math.random() - 0.5) * shakeIntensityRef.current * 2;
          canvas.style.transform = `translate(${dx}px, ${dy}px)`;
          shakeIntensityRef.current *= 0.9; 
          if (shakeIntensityRef.current < 0.5) {
              shakeIntensityRef.current = 0;
              canvas.style.transform = 'none';
          }
      }

      // 1. Logic Update
      const entities = entitiesRef.current;
      const activeEntities = entities.filter(e => !e.isDead);

      // Check Win Condition
      if (activeEntities.length === 1 && entities.length > 1) {
        onGameOver(activeEntities[0].player);
        return; // Stop loop
      }

      // Flag Physics & Logic
      entities.forEach(entity => {
        if (entity.isDead) return;

        // Intro animation
        if (entity.scale < 1) entity.scale += 0.05;

        // Move
        entity.x += entity.vx;
        entity.y += entity.vy;
        entity.rotation += entity.rotationSpeed;

        // Normalize speed
        const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
        // Slightly higher min speed for more action
        const currentMinSpeed = MIN_SPEED * 1.2;
        const currentMaxSpeed = MAX_SPEED * 1.5;

        if (speed < currentMinSpeed) {
           entity.vx = (entity.vx / speed) * currentMinSpeed;
           entity.vy = (entity.vy / speed) * currentMinSpeed;
        }
        if (speed > currentMaxSpeed) {
            entity.vx = (entity.vx / speed) * currentMaxSpeed;
            entity.vy = (entity.vy / speed) * currentMaxSpeed;
        }

        // Boundary Collision (Circle)
        const distFromCenter = Math.sqrt((entity.x - centerX) ** 2 + (entity.y - centerY) ** 2);
        if (distFromCenter + entity.radius > arenaRadius) {
          const angleToCenter = Math.atan2(entity.y - centerY, entity.x - centerX);
          const overlap = (distFromCenter + entity.radius) - arenaRadius;
          entity.x -= overlap * Math.cos(angleToCenter);
          entity.y -= overlap * Math.sin(angleToCenter);

          const normalX = Math.cos(angleToCenter);
          const normalY = Math.sin(angleToCenter);
          const dot = entity.vx * normalX + entity.vy * normalY;
          
          entity.vx = entity.vx - 2 * dot * normalX;
          entity.vy = entity.vy - 2 * dot * normalY;
          
          // Wall damage? Maybe small logic here later, for now just bounce
        }
      });

      // Collision Resolution (Separate Loop)
      // We iterate uniquely over pairs
      for (let i = 0; i < activeEntities.length; i++) {
          for (let j = i + 1; j < activeEntities.length; j++) {
              const e1 = activeEntities[i];
              const e2 = activeEntities[j];

              const dx = e2.x - e1.x;
              const dy = e2.y - e1.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const minDist = e1.radius + e2.radius;

              if (dist < minDist) {
                  // 1. Resolve Overlap (Push apart)
                  const overlap = minDist - dist;
                  const nx = dx / dist; // Normal vector pointing from e1 to e2
                  const ny = dy / dist;
                  
                  // Move apart proportional to inverse mass (equal mass for now)
                  const totalMass = e1.mass + e2.mass;
                  const m1Ratio = e2.mass / totalMass;
                  const m2Ratio = e1.mass / totalMass;

                  e1.x -= nx * overlap * m1Ratio;
                  e1.y -= ny * overlap * m1Ratio;
                  e2.x += nx * overlap * m2Ratio;
                  e2.y += ny * overlap * m2Ratio;

                  // 2. Elastic Collision (Bounce)
                  const dvx = e2.vx - e1.vx;
                  const dvy = e2.vy - e1.vy;
                  const velAlongNormal = dvx * nx + dvy * ny;

                  // Only bounce if moving towards each other
                  if (velAlongNormal < 0) {
                      const restitution = 0.9; // Bounciness
                      const j = -(1 + restitution) * velAlongNormal;
                      const impulse = j / (1/e1.mass + 1/e2.mass);
                      
                      const impulseX = impulse * nx;
                      const impulseY = impulse * ny;

                      e1.vx -= impulseX / e1.mass;
                      e1.vy -= impulseY / e1.mass;
                      e2.vx += impulseX / e2.mass;
                      e2.vy += impulseY / e2.mass;

                      // 3. Battle Logic (Damage & Effects)
                      // prevent ultra-rapid hits in same frame if we had sub-stepping, 
                      // but here simple debounce helps visual sanity
                      if (time - e1.lastHitTime > 100 || time - e2.lastHitTime > 100) {
                          e1.lastHitTime = time;
                          e2.lastHitTime = time;

                          // Random damage 10-20
                          const dmg1 = Math.floor(Math.random() * 15) + 5;
                          const dmg2 = Math.floor(Math.random() * 15) + 5;
                          
                          e1.hp -= dmg1;
                          e2.hp -= dmg2;

                          // Spark Effect (Small)
                          const midX = (e1.x + e2.x) / 2;
                          const midY = (e1.y + e2.y) / 2;
                          spawnParticles(midX, midY, '#fff', 5, 0.5);
                          playHit();

                          // Screen shake on heavy hits (rare) or just slight bump
                          shakeIntensityRef.current = Math.max(shakeIntensityRef.current, 3);
                      }
                  }
              }
          }
      }

      // Check Deaths after collision
      entities.forEach(entity => {
          if (!entity.isDead && entity.hp <= 0) {
              entity.isDead = true;
              
              // Winner buff logic finding who killed it? 
              // Hard to track "killer" with physics, so we give a global buff or just leave it chaotic.
              // Let's buff everyone else slightly? Or just simple death.

              // Big Explosion
              shakeIntensityRef.current = 20;
              playPop();
              spawnParticles(entity.x, entity.y, entity.player.color, 40, 1.5);
          }
      });


      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92; 
        p.vy *= 0.92;
        p.vy -= 0.05; 
        p.life -= 0.03;
        if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
        }
      }

      // 2. Render
      ctx.clearRect(0, 0, width, height);

      // Arena Floor
      const gradient = ctx.createRadialGradient(centerX, centerY, arenaRadius * 0.2, centerX, centerY, arenaRadius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, arenaRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Arena Border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Draw Particles
      particlesRef.current.forEach(p => {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
      });

      // Draw Flags
      entities.forEach(entity => {
          if (entity.isDead) return;

          ctx.save();
          ctx.translate(entity.x, entity.y);
          // Rotation affects the circle, but we want the health bar to stay upright
          
          // Draw Body
          ctx.save();
          ctx.rotate(entity.rotation);
          ctx.scale(entity.scale, entity.scale);
          
          // Shadow
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 5;

          // Flag Circle
          ctx.beginPath();
          ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
          ctx.closePath();
          
          ctx.save();
          ctx.clip();
          
          if (entity.player.image) {
              try {
                ctx.drawImage(entity.player.image, -entity.radius, -entity.radius, entity.radius * 2, entity.radius * 2);
              } catch (e) {
                ctx.fillStyle = entity.player.color;
                ctx.fill();
              }
          } else {
              ctx.fillStyle = entity.player.color;
              ctx.fill();
          }
          ctx.restore(); // Restore clip

          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore(); // Restore rotation/scale for body

          // --- Draw UI (Health & Name) ---
          // No rotation, just position translation
          
          // Name Tag
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Fredoka';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          // Position name above
          ctx.fillText(entity.player.name, 0, -entity.radius - 15);

          // Health Bar
          const barWidth = 40;
          const barHeight = 6;
          const healthPct = Math.max(0, entity.hp / entity.maxHp);
          
          // Background
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(-barWidth/2, -entity.radius - 10, barWidth, barHeight);
          
          // Foreground (Green -> Red)
          const hpColor = healthPct > 0.5 ? '#22c55e' : (healthPct > 0.25 ? '#f59e0b' : '#ef4444');
          ctx.fillStyle = hpColor;
          ctx.fillRect(-barWidth/2 + 1, -entity.radius - 9, (barWidth-2) * healthPct, barHeight - 2);

          ctx.restore(); // Restore translate
      });

      animationFrameRef.current = requestAnimationFrame((t) => render(t));
    };

    animationFrameRef.current = requestAnimationFrame((t) => render(t));

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        resizeObserver.disconnect();
    };
  }, [isPlaying, onGameOver]);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full relative overflow-hidden"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default Arena;