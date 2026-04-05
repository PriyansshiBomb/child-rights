const GRASS = 0;
const PATH = 1;
const WATER = 2;
const TREE = 3;
const FLOWER = 4;
const COAST = 5;
const BRIDGE = 6;
const STATUE_BASE = 7;
const STATUE_TOP = 8;
const OCEAN = 9;

export const TILE_SIZE = 48;

// 20 columns x 15 rows for exact Wargroove style screenshot
export const MAP_DATA = [
  [0, 0, 0, 0, 0, 2, 0, 0, 8, 8, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
  [0, 3, 3, 3, 3, 2, 0, 0, 7, 7, 0, 0, 2, 3, 3, 0, 0, 0, 0, 0],
  [0, 3, 0, 0, 3, 2, 0, 3, 3, 1, 3, 3, 2, 0, 3, 3, 3, 0, 0, 0],
  [2, 2, 0, 0, 0, 2, 3, 3, 0, 1, 0, 3, 2, 0, 0, 0, 3, 3, 0, 0],
  [0, 2, 2, 0, 0, 2, 2, 2, 0, 1, 0, 2, 2, 2, 0, 0, 0, 3, 3, 0],
  [0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 3, 3],
  [0, 0, 2, 2, 0, 0, 0, 2, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3],
  [0, 0, 0, 2, 2, 2, 0, 2, 0, 1, 0, 2, 0, 0, 0, 0, 3, 3, 0, 0],
  [0, 0, 0, 0, 0, 2, 0, 2, 0, 1, 0, 2, 0, 0, 3, 3, 3, 0, 0, 0],
  [0, 0, 0, 2, 2, 2, 1, 6, 1, 1, 1, 6, 1, 1, 1, 0, 0, 3, 3, 0],
  [0, 0, 2, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 1, 1, 0, 0, 3, 0],
  [0, 0, 2, 0, 0, 3, 3, 2, 0, 0, 0, 2, 0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 2, 0, 3, 3, 3, 2, 0, 0, 0, 2, 5, 5, 5, 5, 1, 5, 5, 5],
  [0, 0, 2, 2, 2, 2, 2, 2, 5, 5, 5, 2, 9, 9, 9, 9, 9, 9, 9, 9],
  [0, 0, 0, 0, 0, 0, 0, 2, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
];

export const MAP_WIDTH  = MAP_DATA[0].length * TILE_SIZE;
export const MAP_HEIGHT = MAP_DATA.length    * TILE_SIZE;

// Safe spawn: center path area
export const SPAWN_X = 9.5 * TILE_SIZE;
export const SPAWN_Y = 6.5 * TILE_SIZE;

/* ── Wargroove RPG Palette ─────────────────────────────────────── */
const C = {
  grassBase:   '#74b044',
  grassLight:  '#8bc452',
  grassDark:   '#5c9135',
  pathBase:    '#e5c282',
  pathDark:    '#cba564',
  waterDeep:   '#286ab2',
  waterMid:    '#3984cf',
  waterLight:  '#63a0de',
  treeTrunk:   '#5a3721',
  treeDark:    '#1e4c21',
  treeMid:     '#2a692a',
  sandBase:    '#e1c890',
  wood:        '#aa7d53',
  woodDark:    '#7c5634',
  statueMid:   '#6e6a67',
  statueDark:  '#4c4946',
  statueLight: '#94908a'
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

      ctx.fillStyle = C.grassBase;
      ctx.fillRect(sx, sy, T, T);

      switch (tile) {
        case GRASS: {
          if ((row + col) % 4 === 0) {
            ctx.fillStyle = C.grassLight;
            ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
          }
          ctx.fillStyle = C.grassLight;
          const seed = row * 31 + col * 17;
          for (let b = 0; b < 4; b++) {
            ctx.fillRect(sx + ((seed + b * 13) % T), sy + ((seed + b * 7) % T), 4, 4);
          }
          break;
        }

        case PATH: {
          ctx.fillStyle = C.pathBase;
          ctx.fillRect(sx, sy, T, T);
          ctx.fillStyle = C.pathDark;
          ctx.fillRect(sx, sy, T, 4);
          ctx.fillRect(sx, sy + T - 4, T, 4);
          if (MAP_DATA[row]?.[col-1] !== PATH && MAP_DATA[row]?.[col-1] !== BRIDGE) {
             ctx.fillRect(sx, sy, 4, T);
          }
          if (MAP_DATA[row]?.[col+1] !== PATH && MAP_DATA[row]?.[col+1] !== BRIDGE) {
             ctx.fillRect(sx + T - 4, sy, 4, T);
          }
          ctx.beginPath();
          ctx.arc(sx + T/2, sy + T/2, 2, 0, Math.PI*2);
          ctx.fill();
          break;
        }

        case WATER:
        case OCEAN: {
          const isOcean = tile === OCEAN;
          ctx.fillStyle = isOcean ? '#1d4d8a' : C.waterMid;
          ctx.fillRect(sx, sy, T, T);
          
          const phase = _waterFrame / 60;
          ctx.fillStyle = isOcean ? C.waterDeep : C.waterLight;
          ctx.fillRect(sx, sy + 6 + Math.sin(phase * Math.PI*2 + col) * 4, T, 4);
          ctx.fillRect(sx, sy + 28 + Math.sin(phase * Math.PI*2 + col + 1) * 4, T, 4);
          
          // Edge borders (banks)
          ctx.fillStyle = C.grassDark;
          if (MAP_DATA[row-1]?.[col] === GRASS || MAP_DATA[row-1]?.[col] === TREE) ctx.fillRect(sx, sy, T, 6);
          if (MAP_DATA[row+1]?.[col] === GRASS || MAP_DATA[row+1]?.[col] === TREE) ctx.fillRect(sx, sy + T - 6, T, 6);
          if (MAP_DATA[row]?.[col-1] === GRASS || MAP_DATA[row]?.[col-1] === TREE) ctx.fillRect(sx, sy, 6, T);
          if (MAP_DATA[row]?.[col+1] === GRASS || MAP_DATA[row]?.[col+1] === TREE) ctx.fillRect(sx + T - 6, sy, 6, T);
          break;
        }

        case BRIDGE: {
          // Water underneath
          ctx.fillStyle = C.waterMid;
          ctx.fillRect(sx, sy, T, T);
          
          // Wood planks
          ctx.fillStyle = C.wood;
          ctx.fillRect(sx, sy + 10, T, T - 20);
          ctx.fillStyle = C.woodDark;
          for (let i=0; i<T; i+=8) {
             ctx.fillRect(sx + i, sy + 10, 2, T - 20);
          }
          // Guard rails
          ctx.fillRect(sx, sy + 6, T, 4);
          ctx.fillRect(sx, sy + T - 10, T, 4);
          break;
        }

        case TREE: {
          ctx.fillStyle = C.grassDark;
          ctx.fillRect(sx, sy, T, T);
          // Trunk
          ctx.fillStyle = C.treeTrunk;
          ctx.fillRect(sx + T/2 - 4, sy + T/2, 8, T/2 - 4);
          // Foliage
          ctx.fillStyle = C.treeDark;
          ctx.fillRect(sx + 4, sy + 8, T - 8, T/2 + 4);
          ctx.fillStyle = C.treeMid;
          ctx.fillRect(sx + 8, sy + 4, T - 16, T/2);
          ctx.fillRect(sx + 8, sy + 16, T - 16, Math.floor(T/3));
          break;
        }
        
        case COAST: {
           ctx.fillStyle = C.sandBase;
           ctx.fillRect(sx, sy, T, T);
           ctx.fillStyle = C.pathDark;
           if ((row+col)%2===0) {
             ctx.fillRect(sx + 10, sy + 10, 4, 4);
           }
           break;
        }

        case STATUE_BASE: {
           ctx.fillStyle = C.statueDark;
           ctx.fillRect(sx, sy, T, T);
           ctx.fillStyle = C.statueMid;
           ctx.beginPath();
           ctx.arc(sx + T/2, sy + T/2, T/2 - 4, 0, Math.PI*2);
           ctx.fill();
           ctx.fillStyle = 'rgba(0,0,0,0.3)';
           ctx.fillRect(sx + 4, sy + 4, T-8, T/2);
           break;
        }
        
        case STATUE_TOP: {
           ctx.fillStyle = C.statueMid;
           // Arch / Bell top shape
           ctx.fillRect(sx + 8, sy + 10, T - 16, T - 10);
           ctx.fillStyle = C.statueLight;
           ctx.fillRect(sx + 12, sy + 12, T - 24, T - 20);
           ctx.fillStyle = C.statueDark;
           ctx.fillRect(sx + 16, sy + 4, T - 32, 6);
           break;
        }
      }
    }
  }
};

export const checkCollision = (x, y) => {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (row < 0 || row >= MAP_DATA.length || col < 0 || col >= MAP_DATA[0].length) return true;
  const tile = MAP_DATA[row][col];
  return tile === WATER || tile === OCEAN || tile === TREE || tile === STATUE_BASE || tile === STATUE_TOP;
};