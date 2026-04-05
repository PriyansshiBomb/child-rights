export class ZoneManager {
  constructor(zones) {
    this.zones = zones;
    this.glowTimer = 0;
  }

  update() {
    this.glowTimer += 0.05;
  }

  // Check if player is inside any zone
  getZoneAtPosition(playerX, playerY) {
    for (const zone of this.zones) {
      const dx = playerX - zone.position.x;
      const dy = playerY - zone.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < zone.radius) {
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

      // Pulsing glow effect
      const pulse = Math.sin(this.glowTimer) * 0.3 + 0.7;
      const glowRadius = zone.radius + Math.sin(this.glowTimer * 2) * 5;

      // Outer glow
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius);
      const zoneColor = isCompleted ? '#00E676' : zone.color;
      gradient.addColorStop(0, `${zoneColor}66`);
      gradient.addColorStop(0.6, `${zoneColor}33`);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Zone border
      ctx.beginPath();
      ctx.arc(screenX, screenY, zone.radius, 0, Math.PI * 2);
      ctx.strokeStyle = isCompleted ? '#00E676' : zone.color;
      ctx.lineWidth = 3 * pulse;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Zone icon
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icons = { education: '📚', food: '🥗', safety: '🛡️', health: '❤️', play: '🎮' };
      ctx.fillText(icons[zone.right] || '⭐', screenX, screenY - 10);

      // Zone name
      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = isCompleted ? '#00E676' : '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, screenX, screenY + 18);

      // Completed checkmark
      if (isCompleted) {
        ctx.font = '16px serif';
        ctx.fillText('✓', screenX + zone.radius - 8, screenY - zone.radius + 8);
      }
    });
  }
}