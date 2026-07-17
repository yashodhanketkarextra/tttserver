/**
 * Original logic sourced from 'ticktactoe-board' package by Henry Okonkwo
 * <https://www.npmjs.com/~chokonaira>
 *
 * License: MIT License
 *
 * Portions of this code are used under the MIT License.
 *
 * Integrated into tttserver under GPL-3.0 License
 *
 */

class TTTBoard {
  grid: string[];
  constructor(grid: string[] = new Array(9).fill('')) {
    this.grid = grid;
  }

  makeMove(position: number, symbol: string): TTTBoard {
    const newGrid = [...this.grid];
    newGrid[position - 1] = symbol;
    return new TTTBoard(newGrid);
  }

  currentMark(): string {
    if (this.availablePositionCount() % 2 !== 0) {
      return 'X';
    }
    return 'O';
  }

  isPositionTaken(position: number): boolean {
    return this.grid[position - 1] !== '';
  }

  availablePositionCount(): number {
    let counter = 0;
    for (let index = 0; index < this.grid.length; index++) {
      this.grid[index] === '' && counter++;
    }
    return counter;
  }

  isGameDraw(): boolean {
    return !this.hasWinner() && this.availablePositionCount() === 0;
  }

  isGameOver(): boolean {
    return this.hasWinner() || this.isGameDraw();
  }

  hasWinner(): boolean {
    const rows = this.rows();
    const columns = this.columns();
    const diagonals = this.diagonals();
    const lines = rows.concat(columns, diagonals);

    const result = lines.filter((line) =>
      line.every((position) => position !== '' && position === line[0]),
    );

    return result.length !== 0;
  }

  rows(): string[][] {
    const rows = [];
    for (let index = 0; index < this.grid.length; index += 3) {
      rows.push(this.grid.slice(index, index + 3));
    }
    return rows;
  }

  columns(): string[][] {
    const columns = [];

    for (let index = 0; index < this.rows().length; index++) {
      const column: string[] = [];

      this.rows().forEach((row) => {
        column.push(row[index]);
      });

      columns.push(column);
    }

    return columns;
  }

  diagonals(): string[][] {
    const firstDiagonal = [];
    const secondDiagonal = [];
    for (let row = 0; row < this.rows().length; row++) {
      firstDiagonal.push(this.rows()[row][row]);
      secondDiagonal.push(this.rows()[row][this.rows().length - row - 1]);
    }
    return [firstDiagonal, secondDiagonal];
  }

  winningPlayer(): string {
    const rows = this.rows();
    const columns = this.columns();
    const diagonals = this.diagonals();
    const lines = rows.concat(columns, diagonals);

    const result = lines.filter((line) =>
      line.every((position) => position !== '' && position === line[0]),
    );
    if (result.length === 0) return '';
    return result[0][0];
  }
}

export default TTTBoard;
