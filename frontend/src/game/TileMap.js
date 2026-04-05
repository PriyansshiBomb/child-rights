const GRASS = 0;
const PATH = 1;
const WATER = 2;
const TREE = 3;
const FLOWER = 4;
const SAND = 5;

export const TILE_SIZE = 48;

// 20 columns x 15 rows — same layout, bigger tiles
export const MAP_DATA = [
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,0,0,0,0,0,3,0,0,0,0,0,0,3,0,0,0,0,0,2],
  [2,0,0,4,0,0,0,0,1,1,1,0,0,0,0,4,0,0,0,2],
  [2,0,0,0,0,3,0,0,1,0,1,0,3,0,0,0,0,0,0,2],
  [2,0,4,0,0,0,0,0,1,0,1,0,0,0,0,0,4,0,0,2],
  [2,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,2],
  [2,3,0,0,1,1,1,1,1,0,1,1,1,1,0,0,0,3,0,2],
  [2,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,2],
  [2,0,0,0,1,0,0,0,0,0,0,0,0,1,0,4,0,0,0,2],
  [2,0,4,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,2],
  [2,0,0,0,1,1,1,1,1,0,1,1,1,1,0,0,0,4,0,2],
  [2,0,0,0,0,0,0,0,5,5,5,0,0,0,0,0,0,0,0,2],
  [2,0,3,0,0,0,0,0,5,5,5,0,0,0,3,0,0,0,0,2],
  [2,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,4,0,0,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

export const MAP_WIDTH  = MAP_DATA[0].length * TILE_SIZE;  // 960px
export const MAP_HEIGHT = MAP_DATA.length    * TILE_SIZE;  // 720px

// Safe spawn: row 7 col 8 — center of the inner open area (grass, not a zone)
export const SPAWN_X = 8.5 * TILE_SIZE;
export const SPAWN_Y = 7.5 * TILE_SIZE;

/* ── Palette ───────────────────────────────────────────────────── */
const C = {
  grassBase:   '#3a8c3f',
  grassLight:  '#4caf50',
  grassDark:   '#2e6e32',
  grassAccent: '#56c95b',
  pathBase:    '#c8a96e',
  pathLight:   '#ddc088',
  pathEdge:    '#a8844a',
  waterDeep:   '#0d47a1',
  waterMid:    '#1565c0',
  waterLight:  '#1976d2',
  waterShine:  '#42a5f5',
  treeTrunk:   '#6d4c41',
  treeDark:    '#1b5e20',
  treeMid:     '#2e7d32',
  treeLight:   '#388e3c',
  flowerPetal: '#e91e63',
  flowerPink:  '#f06292',
  flowerYellow:'#fff176',
  sandBase:    '#f5deb3',
  sandLight:   '#fdf0d0',
  sandDark:    '#d4b483',
};

let _waterFrame = 0;
export const tickWater = () => { _waterFrame = (_waterFrame + 1) % 60; };

export const drawTileMap = (ctx, cameraX, cameraY, canvasWidth, canvasHeight) => {
  const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const endCol   = Math.min(MAP_DATA[0].length, startCol + Math.ceil(canvasWidth  / TILE_SIZE) + 2);
  const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
  const endRow   = Math.min(MAP_DATA.length,    startRow + Math.ceil(canvasHeight / TILE_SIZE) + 2);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = MAP_DATA[row][col];
      const sx   = col * TILE_SIZE - cameraX;
      const sy   = row * TILE_SIZE - cameraY;
      const T    = TILE_SIZE;

      switch (tile) {

        case GRASS: {
          ctx.fillStyle = C.grassBase;
          ctx.fillRect(sx, sy, T, T);
          // subtle variation by position
          if ((row + col) % 3 === 0) {
            ctx.fillStyle = C.grassLight;
            ctx.fillRect(sx, sy, T, T);
          }
          // tiny grass blades
          ctx.fillStyle = C.grassAccent;
          const seed = (row * 31 + col * 17);
          const bx = [4, 12, 22, 33, 40];
          const by = [6, 18, 30, 10, 40];
          for (let b = 0; b < 3; b++) {
            const gx = sx + bx[(seed + b * 7) % bx.length];
            const gy = sy + by[(seed + b * 5) % by.length];
            ctx.fillRect(gx, gy, 2, 5);
          }
          break;
        }

        case PATH: {
          // Base sand path
          ctx.fillStyle = C.pathBase;
          ctx.fillRect(sx, sy, T, T);
          // lighter center
          ctx.fillStyle = C.pathLight;
          ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
          // pebble dots
          ctx.fillStyle = C.pathEdge;
          const ps = (row * 13 + col * 7);
          const px = [8, 20, 33, 14, 38];
          const py = [10, 28, 16, 38, 6];
          for (let p = 0; p < 2; p++) {
            ctx.beginPath();
            ctx.arc(sx + px[(ps + p * 3) % px.length], sy + py[(ps + p * 4) % py.length], 2, 0, Math.PI * 2);
            ctx.fill();
          }
          // edge shading
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.fillRect(sx, sy, T, 2);
          ctx.fillRect(sx, sy, 2, T);
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(sx, sy + T - 2, T, 2);
          ctx.fillRect(sx + T - 2, sy, 2, T);
          break;
        }

        case WATER: {
          const phase = _waterFrame / 60;
          ctx.fillStyle = C.waterDeep;
          ctx.fillRect(sx, sy, T, T);
          // wave bands
          ctx.fillStyle = C.waterMid;
          ctx.fillRect(sx, sy + 4 + Math.sin(phase * Math.PI * 2 + col * 0.8) * 3, T, 6);
          ctx.fillRect(sx, sy + 22 + Math.sin(phase * Math.PI * 2 + col * 0.5 + 1) * 3, T, 6);
          ctx.fillRect(sx, sy + 38 + Math.sin(phase * Math.PI * 2 + col * 0.6 + 2) * 3, T, 6);
          // shine sparkle
          if ((_waterFrame + row * 7 + col * 3) % 20 < 4) {
            ctx.fillStyle = C.waterShine;
            ctx.fillRect(sx + 10 + (col % 5) * 6, sy + 12 + (row % 3) * 10, 3, 2);
          }
          // border darkness
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(sx, sy, T, 2);
          ctx.fillRect(sx, sy, 2, T);
          ctx.fillRect(sx, sy + T - 2, T, 2);
          ctx.fillRect(sx + T - 2, sy, 2, T);
          break;
        }

        case TREE: {
          // ground under tree
          ctx.fillStyle = C.grassDark;
          ctx.fillRect(sx, sy, T, T);
          // trunk
          ctx.fillStyle = C.treeTrunk;
          ctx.fillRect(sx + T/2 - 5, sy + T/2 + 2, 10, T/2 - 4);
          // shadow ellipse
          ctx.beginPath();
          ctx.ellipse(sx + T/2, sy + T - 6, 12, 5, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fill();
          // crown layers
          for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath();
            ctx.arc(sx + T/2, sy + T/2 - 4 - layer * 4, 14 - layer * 2, 0, Math.PI * 2);
            ctx.fillStyle = [C.treeDark, C.treeMid, C.treeLight][layer];
            ctx.fill();
          }
          // highlight
          ctx.beginPath();
          ctx.arc(sx + T/2 - 4, sy + T/2 - 12, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fill();
          break;
        }

        case FLOWER: {
          ctx.fillStyle = C.grassBase;
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = C.grassLight;
          ctx.fillRect(sx, sy, T, T);
          // stem
          ctx.fillStyle = '#388e3c';
          ctx.fillRect(sx + T/2 - 1, sy + T/2 + 2, 2, 12);
          // petals
          const petals = 5;
          for (let p = 0; p < petals; p++) {
            const angle = (p / petals) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
              sx + T/2 + Math.cos(angle) * 7,
              sy + T/2 + Math.sin(angle) * 7,
              5, 3, angle, 0, Math.PI * 2
            );
            ctx.fillStyle = p % 2 === 0 ? C.flowerPetal : C.flowerPink;
            ctx.fill();
          }
          // center
          ctx.beginPath();
          ctx.arc(sx + T/2, sy + T/2, 4, 0, Math.PI * 2);
          ctx.fillStyle = C.flowerYellow;
          ctx.fill();
          break;
        }

        case SAND: {
          ctx.fillStyle = C.sandBase;
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = C.sandLight;
          ctx.fillRect(sx + 3, sy + 3, T - 6, T - 6);
          // ripple lines
          ctx.strokeStyle = C.sandDark;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.4;
          for (let r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.moveTo(sx + 6, sy + 10 + r * 12);
            ctx.quadraticCurveTo(sx + T/2, sy + 6 + r * 12, sx + T - 6, sy + 10 + r * 12);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          break;
        }

        default:
          ctx.fillStyle = C.grassBase;
          ctx.fillRect(sx, sy, T, T);
      }
    }
  }
};

export const checkCollision = (x, y) => {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (row < 0 || row >= MAP_DATA.length || col < 0 || col >= MAP_DATA[0].length) return true;
  const tile = MAP_DATA[row][col];
  return tile === WATER || tile === TREE;
};