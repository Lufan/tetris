import CnameTarget from '@salesforce/schema/Domain.CnameTarget';
import { LightningElement } from 'lwc';

const screenWidth     = 140;
const screenHeight    = 190;
const tableHeight     = 30;
const fieldWidth      = 120;
const fieldHeight     = 180;
const tetraminoWidth  = 40;
const tetraminoHeight = 40;
export default class Tetris extends LightningElement {
  currentTetramino;
  field = [];
  gameSpeed;
  storedGameSpeed;
  minimumGameSpeed = 500;
  maximumGameSpeed = 100;
  droupGameSpeed = 25;
  isGameOver = false;
  interval;
  score = 0;
  currentAction;
  isInitialized = false;

  btnLabel = 'Pause';

  handleKeyPress(event) {
    let actioResult;
    switch (event.key) {
      case 'Escape':
        this.isGameOver = true;
        break;
      case 'a':
      case 'ArrowLeft':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.moveLeftIfPossible(this.field);
        }
        break;
      case 'd':
      case 'ArrowRight':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.moveRightIfPossible(this.field);
        }
        break;
      case ' ':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.rotateIfPossible(this.field);
        }
        break;
        case 's':
      case 'ArrowDown':
        if (this.currentTetramino) {
          actioResult = this.currentTetramino.moveDownIfPossible(this.field);
          this.storedGameSpeed = this.gameSpeed;
          this.gameSpeed = this.droupGameSpeed;
        }
        break;
    }
    if (actioResult) {
      this.currentAction = true;
    }
  }

  handleClick() {
    if (this.isGameOver) {
      this.isInitialized = false;
      this.isGameOver = false;
      this.currentTetramino = null;
      const canvas = this.template.querySelector('.lufs-field-canvas');
      const ctx = canvas.getContext('2d');
      ctx.translate(-10, 0); // move origin to the 0,0
      this.field = [];
      this.renderedCallback();
      this.btnLabel = 'Pause';
    } else {

    }
}

  renderedCallback() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const canvas = this.template.querySelector('.lufs-field-canvas');
    const canvasDt = this.template.querySelector('.lufs-data-canvas');
    if (canvas && canvasDt && canvas.getContext && !this.isGameOver) {
      const ctx = canvas.getContext('2d');
      this.drawBoard(ctx);
      this.gameSpeed = this.minimumGameSpeed - 1;
      this.score = 0;

      const painter = this.drawSegment.bind(this, ctx);

      const ctxDt = canvasDt.getContext('2d');

      this.drawTable(ctxDt);
      this.updateTable(ctxDt);

      this.gameLoop(painter, ctx, ctxDt);

    } else {
      console.warn('Game Over or Canvas not found or not supported!');
    }
  }

  async gameLoop(painter, ctx, ctxDt) {
    if (this.isGameOver) {
      this.btnLabel = 'Start';
      return;
    }
    if (!this.currentTetramino) {
      this.currentTetramino = this.createNewTetramino();
    }
    if (!this.currentAction) {
      const actionResult = this.currentTetramino.moveDownIfPossible(this.field);
      if (!actionResult) {
        // restore game speed if droup appears
        if (this.storedGameSpeed) {
          this.gameSpeed = this.storedGameSpeed;
          this.storedGameSpeed = null;
        }
        // add current tetramino to the field and generate new one
        this.currentTetramino.imprintToField(this.field);
        await this.checkFilledLinesUpdateScoreAndSpeed(ctx, ctxDt);
        this.currentTetramino = this.createNewTetramino();
        if (!this.currentTetramino.ifPossible(this.field)) {
          this.isGameOver = true;
        }
      }
    }
    this.drawField(ctx);
    this.currentTetramino.draw(painter);
    this.currentAction = false;

    setTimeout(this.gameLoop.bind(this, painter, ctx, ctxDt), this.gameSpeed);
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

  drawTable(ctx) {
    const currentFillStyle = ctx.fillStyle;
    ctx.fillStyle = '#f3f2f2';
    ctx.fillRect(0, 0, screenWidth, tableHeight);
    ctx.fillStyle = currentFillStyle;
    for (let x = 0; x < screenWidth; x += 10) {
      for (let y = 0; y < tableHeight; y += 10) {
        this.drawBrick(ctx, x, y);
      }
    }
    ctx.fillStyle = '#f3f2f2';
    ctx.fillRect(10, 5, screenWidth / 2 - 20, tableHeight - 10);
    ctx.fillRect(screenWidth / 2 + 10, 5, screenWidth / 2 - 20, tableHeight - 10);
    ctx.fillStyle = currentFillStyle;
    ctx.strokeRect(0, 0, screenWidth, tableHeight);
    ctx.strokeRect(10, 5, screenWidth / 2 - 20, tableHeight - 10);
    ctx.strokeRect(screenWidth / 2 + 10, 5, screenWidth / 2 - 20, tableHeight - 10);
    ctx.font = '16px serif';
    ctx.fillText('S: ', 15, 20);
    ctx.fillText('V: ', screenWidth / 2 + 15, 20);
  }

  updateTable(ctx) {
    ctx.save();
    ctx.fillStyle = '#f3f2f2'
    ctx.fillRect(35, 7, screenWidth / 2 - 47, tableHeight - 14);
    ctx.fillRect(screenWidth / 2 + 35, 7, screenWidth / 2 - 47, tableHeight - 14);
    ctx.restore();

    ctx.save();
    ctx.font = '12px serif';
    ctx.fillText(this.score, 35, 20);
    const velocity = Math.round(100 * (1 - (this.gameSpeed - this.maximumGameSpeed) / (this.minimumGameSpeed - this.maximumGameSpeed)));
    ctx.fillText(velocity, screenWidth / 2 + 35, 20);
    ctx.restore();
  }

  drawSegment(ctx, dx, dy) {
    ctx.beginPath();
    const currentColor = ctx.fillStyle;
    ctx.fillStyle = this.color;
    ctx.fillRect(dx * 10 + 1, dy * 10 + 1, 8, 8);
    ctx.fillStyle = currentColor;
    ctx.closePath();
  }

  clearSegment(ctx, dx, dy) {
    ctx.beginPath();
    const currentColor = ctx.fillStyle;
    ctx.fillStyle = 'white';
    ctx.fillRect(dx * 10 + 1, dy * 10 + 1, 8, 8);
    ctx.fillStyle = currentColor;
    ctx.closePath();
  }

  async checkFilledLinesUpdateScoreAndSpeed(ctx, ctxDt) {
    if (this.field) {
      let removedLines = 1;
      for (let dy = Math.round((fieldHeight - 10) / 10); dy >= 0; dy--) { // from down to up
        let isFullLine = true;
        let isContinue = false;
        for (let dx = 0; dx < fieldWidth / 10; dx++) {
          isFullLine &= this.field[dx][dy];
          isContinue |= this.field[dx][dy];
        }
        if (isFullLine) {
          await this.removeLineAndUdateField(dy, ctx);
          dy++; // if the line is deleted we need to check the current line again because it is overwritten by the line above

          this.score += 10 * (removedLines * removedLines); // more lines removed - more score achieved
          removedLines++;
          if (this.gameSpeed > this.maximumGameSpeed) {
            this.gameSpeed -= 20;
          }
          this.updateTable(ctxDt);
        }
        if (!isContinue) {
          return;
        }
      }
    }
  }

  async removeLineAndUdateField(lineNumber, ctx) {
    for (let dx = 0; dx < fieldWidth / 10; dx++) {
      this.field[dx][lineNumber] = false;
    }
    this.drawField(ctx);
    return new Promise((resolve) => {
      setTimeout(
        () => {
          for (let dy = lineNumber; dy >= 1; dy--) { // from down to up
            let isContinue = false;
            for (let dx = 0; dx < fieldWidth / 10; dx++) {
              this.field[dx][dy] = this.field[dx][dy - 1];
              isContinue |= this.field[dx][dy];
            }
            if (!isContinue) {
              break;
            }
          }
          return resolve();
        },
        this.gameSpeed
      );
    });
  }

  createNewTetramino() {
    return new Tetramino((screenWidth / 2 - tetraminoWidth / 2) / 10, 0, 0);
  }

  drawBoard(ctx) {
    const currentFillStyle = ctx.fillStyle;
    ctx.fillStyle = '#f3f2f2';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.fillStyle = currentFillStyle;
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

  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    let rndPos = Math.round(Math.random() * 7);
    if (rndPos === 7) rndPos = 0;
    console.log(rndPos, TETROMINOS[rndPos]);
    this.field = TETROMINOS[rndPos];
  }
  draw(painter) {
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
  ifPossible(field) {
    return this.applyIfPossible(field, null);
  }
  applyIfPossible(field, mode) {
    let newField = mode ? JSON.parse(JSON.stringify(this.field)): this.field;
    let newX     = this.x;
    let newY     = this.y;

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
