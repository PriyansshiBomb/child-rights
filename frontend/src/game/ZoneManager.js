export class ZoneManager {
  constructor(zones) {
    // Override positions to neatly sit on our new paths and bridges (48px tiles)
    const positions = [
      { x: 5.5 * 48, y: 9.5 * 48, npc: 'knight' },  // Far west path
      { x: 9.5 * 48, y: 9.5 * 48, npc: 'bandit' },  // Center crossroad
      { x: 14.5 * 48, y: 9.5 * 48, npc: 'dog' },    // Far east bridge
      { x: 9.5 * 48, y: 4.5 * 48, npc: 'knight' },  // Far north path
      { x: 17.5 * 48, y: 12.5 * 48, npc: 'dog' },   // Deep south east harbor
      { x: 9.5 * 48, y: 13.5 * 48, npc: 'bandit' }, // Far south
      { x: 1.5 * 48, y: 13.5 * 48, npc: 'dog' }     // Deep south west
    ];

    this.zones = zones.map((z, i) => ({
      ...z,
      position: positions[i % positions.length],
      radius: 20
    }));
    this.glowTimer = 0;
  }

  update() {
    this.glowTimer += 0.05;
  }

  getZoneAtPosition(playerX, playerY) {
    for (const zone of this.zones) {
      const dx = playerX - zone.position.x;
      const dy = playerY - zone.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < zone.radius * 1.5) {
        return zone;
      }
    }
    return null;
  }

  draw(ctx, cameraX, cameraY, completedZoneIds) {
    this.zones.forEach(zone => {
      const screenX = zone.position.x - cameraX;
      const screenY = zone.position.y - cameraY;
      const isCompleted = completedZoneIds.includes(zone._id);

      const pulse = Math.sin(this.glowTimer) * 2;
      
      // Draw shadow beneath NPC
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + 12, 10 + pulse, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw NPC Sprites (procedural pixel art blobs)
      this.drawNPC(ctx, screenX, screenY, zone.position.npc, isCompleted);

      // Hover indicator arrow
      if (!isCompleted) {
        const arrowY = screenY - 25 + Math.sin(this.glowTimer * 3) * 4;
        ctx.fillStyle = '#ffde00';
        ctx.beginPath();
        ctx.moveTo(screenX - 5, arrowY - 6);
        ctx.lineTo(screenX + 5, arrowY - 6);
        ctx.lineTo(screenX, arrowY);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Completed mark
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#00E676';
        ctx.textAlign = 'center';
        ctx.fillText('✓', screenX, screenY - 20);
      }
    });
  }

  drawNPC(ctx, x, y, type, isCompleted) {
    ctx.save();
    ctx.translate(x - 8, y - 10);
    const S = 2; // pixel scale
    // Arrays: 0=clear, 1=outline, 2=skin, 3=cloth, 4=metal/accent
    
    let colors = {};
    let pixels = [];

    if (type === 'bandit') {
      colors = { 1: '#2d1b11', 2: '#e6c89e', 3: '#932222', 4: '#5a5a5a' };
      pixels = [
        [0,1,1,1,1,1,1,0],
        [1,3,3,3,3,3,3,1], // bandanna
        [1,2,1,2,2,1,2,1], // eyes
        [1,3,3,3,3,3,3,1], // mask
        [0,1,3,3,3,3,1,0],
        [1,3,3,3,3,3,3,1],
        [1,1,1,4,4,1,1,1], // belt
        [0,1,1,0,0,1,1,0]
      ];
    } else if (type === 'knight') {
      colors = { 1: '#1a1a1a', 2: '#e6c89e', 3: '#6a738c', 4: '#a3aebb' };
      pixels = [
        [0,1,1,1,1,1,0,0],
        [1,4,4,4,4,4,1,0], // helm
        [1,1,1,1,1,1,1,0],
        [1,4,4,4,4,4,4,1],
        [0,1,3,3,3,3,1,0], // armor body
        [1,4,4,4,4,4,4,1],
        [1,1,4,4,4,4,1,1],
        [0,1,1,0,0,1,1,0]
      ];
    } else { // dog
      colors = { 1: '#1b120c', 2: '#c98a4b', 3: '#eadecf', 4: '#1b120c'};
      pixels = [
        [0,0,0,0,0,0,0,0],
        [0,2,0,0,0,0,2,0],
        [1,2,2,2,2,2,2,1],
        [1,1,2,1,1,2,1,1],
        [0,1,3,3,3,3,1,0],
        [0,0,1,1,1,1,0,0],
        [0,1,2,2,2,2,1,0],
        [0,1,1,0,0,1,1,0]
      ];
    }

    // Grayscale if completed
    if (isCompleted) {
      colors[2] = '#a0a0a0';
      colors[3] = '#707070';
      colors[4] = '#b0b0b0';
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const val = pixels[r][c];
        if (val > 0) {
          ctx.fillStyle = colors[val];
          ctx.fillRect(c * S, r * S, S, S);
        }
      }
    }
    ctx.restore();
  }
}