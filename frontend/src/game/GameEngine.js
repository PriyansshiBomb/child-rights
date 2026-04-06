import { Player } from './Player';
import { drawTileMap, tickWater, MAP_WIDTH, MAP_HEIGHT, SPAWN_X, SPAWN_Y, checkCollision } from './TileMap';
import { ZoneManager } from './ZoneManager';

export class GameEngine {
  constructor(canvas, zones, completedZoneIds, onZoneEnter, playerStartPos) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.zones  = zones;
    this.completedZoneIds = completedZoneIds || [];
    this.onZoneEnter = onZoneEnter;
    this.running     = false;
    this.animFrameId = null;

    this.keys = {};

    // Use explicit safe spawn point from TileMap, or saved position
    const startX = playerStartPos?.x ?? SPAWN_X;
    const startY = playerStartPos?.y ?? SPAWN_Y;
    this.player = new Player(startX, startY);

    this.zoneManager = new ZoneManager(zones);

    this.cameraX = 0;
    this.cameraY = 0;

    this.lastZoneId       = null;
    this.zoneEnterCooldown = 0;

    this.handleKeyDown = (e) => {
      this.keys[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    };
    this.handleKeyUp = (e) => { this.keys[e.key] = false; };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup',   this.handleKeyUp);
  }

  // ── Fit canvas to its CSS container ──────────────────────────
  fitCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.canvas.width  = Math.floor(rect.width);
      this.canvas.height = Math.floor(rect.height);
    }
  }

  start() {
    // One frame delay so browser has finished layout
    requestAnimationFrame(() => {
      this.fitCanvas();

      this._resizeObserver = new ResizeObserver(() => this.fitCanvas());
      if (this.canvas.parentElement) {
        this._resizeObserver.observe(this.canvas.parentElement);
      }

      this.running = true;
      this.loop();
    });
  }

  stop() {
    this.running = false;
    if (this.animFrameId)     cancelAnimationFrame(this.animFrameId);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup',   this.handleKeyUp);
  }

  updateCamera() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.cameraX = Math.max(0, Math.min(MAP_WIDTH  - cw, this.player.x - cw / 2));
    this.cameraY = Math.max(0, Math.min(MAP_HEIGHT - ch, this.player.y - ch / 2));
  }

  checkZoneEntry() {
    if (this.zoneEnterCooldown > 0) { this.zoneEnterCooldown--; return; }
    const zone = this.zoneManager.getZoneAtPosition(this.player.x, this.player.y);
    if (zone && zone._id !== this.lastZoneId) {
      this.lastZoneId        = zone._id;
      this.zoneEnterCooldown = 180;
      this.onZoneEnter(zone);
    }
    if (!zone) this.lastZoneId = null;
  }

  loop() {
    if (!this.running) return;
    const { ctx, canvas } = this;

    tickWater();

    const prevX = this.player.x;
    const prevY = this.player.y;
    this.player.update(this.keys, MAP_WIDTH, MAP_HEIGHT);

    const { x, y } = this.player;
    const r = 8; // Reduced from 14 to make squeezing through bridges much smoother
    if (
      checkCollision(x - r, y - r) || checkCollision(x + r, y - r) ||
      checkCollision(x - r, y + r) || checkCollision(x + r, y + r)
    ) {
      this.player.x = prevX;
      this.player.y = prevY;
    }

    this.zoneManager.update();
    this.updateCamera();
    this.checkZoneEntry();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTileMap(ctx, this.cameraX, this.cameraY, canvas.width, canvas.height);
    this.zoneManager.draw(ctx, this.cameraX, this.cameraY, this.completedZoneIds);
    this.player.draw(ctx, this.cameraX, this.cameraY);

    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  getPlayerPosition()          { return { x: this.player.x, y: this.player.y }; }
  updateCompletedZones(ids)    { this.completedZoneIds = ids; }
}