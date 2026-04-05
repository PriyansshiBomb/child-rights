export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width  = 32;
    this.height = 32;
    this.speed  = 3.5;
    this.direction = 'down';
    this.moving    = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.bobOffset = 0;
    this.trailParticles = [];
  }

  update(keys, mapWidth, mapHeight) {
    let dx = 0, dy = 0;
    this.moving = false;

    if (keys['ArrowUp']    || keys['w'] || keys['W']) { dy = -this.speed; this.direction = 'up';    this.moving = true; }
    if (keys['ArrowDown']  || keys['s'] || keys['S']) { dy =  this.speed; this.direction = 'down';  this.moving = true; }
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) { dx = -this.speed; this.direction = 'left';  this.moving = true; }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx =  this.speed; this.direction = 'right'; this.moving = true; }

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    this.x = Math.max(16, Math.min(mapWidth  - 16, this.x + dx));
    this.y = Math.max(16, Math.min(mapHeight - 16, this.y + dy));

    if (this.moving) {
      this.animTimer++;
      if (this.animTimer > 7) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
      this.bobOffset = Math.sin(this.animFrame * Math.PI / 2) * 2;

      // Emit trail particle
      if (this.animFrame % 2 === 0) {
        this.trailParticles.push({
          x: this.x + (Math.random() - 0.5) * 8,
          y: this.y + 10,
          life: 12,
          maxLife: 12,
          r: Math.random() * 4 + 2,
        });
      }
    } else {
      this.animFrame = 0;
      this.bobOffset = 0;
    }

    // Update trail
    this.trailParticles = this.trailParticles
      .map(p => ({ ...p, life: p.life - 1, y: p.y + 0.5 }))
      .filter(p => p.life > 0);
  }

  draw(ctx, cameraX, cameraY) {
    const sx = this.x - cameraX;
    const sy = this.y - cameraY - this.bobOffset;

    // Draw trail particles
    for (const p of this.trailParticles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y - cameraY, p.r * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.4})`;
      ctx.fill();
    }

    // Shadow on ground
    ctx.beginPath();
    ctx.ellipse(sx, sy + 16, 11, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();

    // Glow ring (always visible, pulses)
    const glowPulse = 0.55 + 0.2 * Math.sin(Date.now() / 400);
    ctx.beginPath();
    ctx.arc(sx, sy, 20, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${glowPulse})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // ── Body ──────────────────────────────────────────────
    // Hat brim
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 10, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat top
    ctx.fillStyle = '#6d28d9';
    ctx.fillRect(sx - 9, sy - 24, 18, 15);
    ctx.beginPath();
    ctx.arc(sx - 9, sy - 24, 0, 0, 0); // square corners
    ctx.fillRect(sx - 9, sy - 26, 18, 3);

    // Hat star
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', sx, sy - 16);

    // Head
    const headGrad = ctx.createRadialGradient(sx - 3, sy - 4, 2, sx, sy, 13);
    headGrad.addColorStop(0, '#fde68a');
    headGrad.addColorStop(1, '#f59e0b');
    ctx.beginPath();
    ctx.arc(sx, sy, 13, 0, Math.PI * 2);
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eyes (direction-aware)
    ctx.fillStyle = '#1e1b4b';
    const eyeOffsets = {
      down:  [[-4, -2], [4, -2]],
      up:    [[-4, -4], [4, -4]],
      left:  [[-5, -2], [1, -2]],
      right: [[-1, -2], [5, -2]],
    };
    for (const [ex, ey] of eyeOffsets[this.direction]) {
      ctx.beginPath();
      ctx.arc(sx + ex, sy + ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // eye shine
      ctx.beginPath();
      ctx.arc(sx + ex + 0.8, sy + ey - 0.8, 0.9, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
    }

    // Smile (only when facing down or moving)
    if (this.direction === 'down' || this.moving) {
      ctx.beginPath();
      ctx.arc(sx, sy + 3, 5, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Rosy cheeks
    ctx.beginPath();
    ctx.arc(sx - 8, sy + 1, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 113, 133, 0.55)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 8, sy + 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cape / backpack hint
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy + 10);
    ctx.lineTo(sx + 5, sy + 10);
    ctx.lineTo(sx + 7, sy + 18);
    ctx.lineTo(sx - 7, sy + 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6d28d9';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}