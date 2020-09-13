import { LightningElement } from 'lwc';

const screenWidth     = 140;
const screenHeight    = 190;
const fieldWidth      = 120;
const fieldHeight     = 180;
const tetraminoWidth  = 40;
const tetraminoHeight = 40;
export default class Tetris extends LightningElement {
  currentTetramino;
  field = [];
  gameSpeed  = 400;
  isGameOver = false;
  interval;
  score = 0;
  currentAction;

  handleKeyPress(event) {
    console.log('handleKeyPress');
    console.log(event.key);
    let actioResult;
    switch (event.key) {
      case 'Escape':
        this.isGameOver = true;
        break;
      case 'a':
      case 'ArrowLeft':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.moveLeftIfPossible(this.field)
        }
        break;
      case 'd':
      case 'ArrowRight':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.moveRightIfPossible(this.field)
        }
        break;
      case ' ':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.rotateIfPossible(this.field)
        }
        break;
        case 's':
      case 'ArrowDown':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.moveDownIfPossible(this.field)
        }
        break;
    }
    if (actioResult) {
      this.currentAction = true;
    }
    console.log(actioResult);
  }

  renderedCallback() {
    const canvas = this.template.querySelector('.lufs-canvas');
    if (canvas && canvas.getContext && !this.isGameOver) {

      const ctx = canvas.getContext('2d');
      this.drawBoard(ctx);
      console.log(this.field);
      const painter = this.drawSegment.bind(this, ctx);
      this.interval = setInterval(
        () => {
          if (this.isGameOver) {
            clearInterval(this.interval);
            return;
          }
          if (!this.currentTetramino) {
            this.currentTetramino = this.createNewTetramino();
          }
          if (!this.currentAction) {
            const actionResult = this.currentTetramino.moveDownIfPossible(this.field);
            if (!actionResult) {
              // add current tetramino to the field and generate new one
              this.currentTetramino.imprintToField(this.field);
              this.currentTetramino = this.createNewTetramino();
            }
          }
          this.drawField(ctx);
          this.currentTetramino.draw(painter);
          this.currentAction = false;
          //this.checkFilledLines();
       },
       this.gameSpeed
      );
    } else {
      console.warn('Canvas not found or not supportet!');
    }
  }

  drawField(ctx) {
    if (this.field) {
      for (let dx = 0; dx < fieldWidth / 10; dx++) {
        for (let dy = 0; dy < fieldHeight / 10; dy++) {
          if (this.field[dx][dy]) {
            this.drawSegment(ctx, dx, dy);
          } else {
            this.clearSegment(ctx, dx, dy);
          }
        }
      }
    }
  }

  drawSegment(ctx, dx, dy) {
    ctx.beginPath();
    const currentColor = ctx.fillStyle;
    ctx.fillStyle = this.color;
    ctx.fillRect(dx * 10, dy * 10, 8, 8);
    ctx.fillStyle = currentColor;
    ctx.closePath();
  }

  clearSegment(ctx, dx, dy) {
    ctx.beginPath();
    const currentColor = ctx.fillStyle;
    ctx.fillStyle = 'white';
    ctx.fillRect(dx * 10, dy * 10, 10, 10);
    ctx.fillStyle = currentColor;
    ctx.closePath();
  }

  createNewTetramino() {
    return new Tetramino((screenWidth / 2 - tetraminoWidth / 2) / 10, 0, 0, 0);
  }

  drawBoard(ctx) {
    ctx.strokeRect(0, 0, screenWidth, screenHeight);
    ctx.strokeRect(10, 0, screenWidth - 20, screenHeight - 10);
    for (let x = 0; x < screenWidth; x += 10) {
      for (let y = 0; y < screenHeight; y += 10) {
        if (x === 0 ||
          x === screenWidth - 10 ||
          y === screenHeight - 10
        ) { // border;
          this.drawBrick(ctx, x, y);
        }
      }
    }
    for (let x = 0; x < fieldWidth / 10; x++) {
      this.field.push([]);
      for (let y = 0; y < fieldHeight / 10; y++) {
        this.field[x].push(false);
      }
    }
    ctx.translate(10, 0); // move origin beside the border
  }

  drawBrick(ctx, x, y) {
    ctx.fillRect(x + 0, y + 1, 4, 3);
    ctx.fillRect(x + 6, y + 1, 4, 3);
    ctx.fillRect(x + 1, y + 6, 8, 3);
  }
}

const TETROMINOS = [
  [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  [
    [0,0,0,0],
    [1,1,1,0],
    [0,1,0,0],
    [0,0,0,0]
  ],
  [
    [0,0,0,0],
    [0,1,1,0],
    [0,1,1,0],
    [0,0,0,0]
  ],
  [
    [0,0,0,0],
    [1,1,0,0],
    [0,1,1,0],
    [0,0,0,0]
  ],
  [
    [0,0,0,0],
    [0,1,1,0],
    [1,1,0,0],
    [0,0,0,0]
  ],
  [
    [0,0,0,0],
    [0,0,1,0],
    [1,1,1,0],
    [0,0,0,0]
  ],
  [
    [0,0,0,0],
    [1,1,1,0],
    [0,0,1,0],
    [0,0,0,0]
  ]
]
class Tetramino {
  field;
  x;
  y;
  color;

  constructor(x, y, angle, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    let rndPos = Math.round(Math.random() * 7);
    if (rndPos === 7) rndPos = 0;
    console.log(rndPos, TETROMINOS[rndPos]);
    this.field = TETROMINOS[rndPos];
  }
  draw(painter) {
    console.log('draw', this.field);
    if (this.field) {
      for (let dx = 0; dx < tetraminoWidth / 10; dx++) {
        for (let dy = 0; dy < tetraminoHeight / 10; dy++) {
          if (this.field[dx][dy]) {
            painter(this.x + dx, this.y + dy);
          }
        }
      }
    }
  }
  imprintToField(field) {
    console.log('transferToField', this.field);
    if (this.field) {
      for (let dx = 0; dx < tetraminoWidth / 10; dx++) {
        for (let dy = 0; dy < tetraminoHeight / 10; dy++) {
          if (this.field[dx][dy]) {
            field[this.x + dx][this.y + dy] = this.field[dx][dy];
          }
        }
      }
    }
  }

  moveRightIfPossible(field) {
    return this.applyIfPossible(field, 'move-right');
  }
  moveLeftIfPossible(field) {
    return this.applyIfPossible(field, 'move-left');
  }
  moveDownIfPossible(field) {
    return this.applyIfPossible(field, 'move-down');
  }
  rotateIfPossible(field) {
    return this.applyIfPossible(field, 'rotate');
  }
  applyIfPossible(field, mode) {
    let newField = JSON.parse(JSON.stringify(this.field));
    let newX     = this.x;
    let newY     = this.y;
    console.log('before', JSON.parse(JSON.stringify([newX, newY, newField])));
    switch (mode) {
      case 'move-right':
        newX++;
        break;
      case 'move-left':
        newX--;
        break;
      case 'move-down':
        newY++;
        break;
      case 'rotate':
        newField = this.rotateCW(newField);
        break;
    }
    console.log('after', JSON.parse(JSON.stringify([newX, newY, newField])));
    for (let px = 0; px < 4; px++) {
      for (let py = 0; py < 4; py++) {
        if (!newField[px][py]) continue;
        if ((newX + px) * 10 < 0 ||                            // left boundary
          (newX + px) * 10 >= fieldWidth ||                    // right boundary
          field[newX + px] && field[newX + px][newY + py] ||   // not empty
          (newY + py) * 10 >= fieldHeight                      // down boundary
        ) {
          return false;
        }
      }
    }
    this.x     = newX;
    this.y     = newY;
    this.field = newField;
    return true;
  }
  rotateCW(field) {
    const newField = [...field];
    this.transpose(newField);
    this.reverseRow(newField);
    return newField;
  }
  reverseRow(field) {
    for (let x = 0; x < 4; x++) {
      let start = 0;
      let last  = 3;
      while (start < last) {
        const temp = field[x][start];
        field[x][start++] = field[x][last];
        field[x][last--]  = temp;
      }
    }
  }

  transpose(field) {
    for (let x = 0; x < 4; x++) {
      for (let y = x; y < 4; y++) {
        let temp = field[x][y];
        field[x][y] = field[y][x];
        field[y][x] = temp;
      }
    }
  }
}
