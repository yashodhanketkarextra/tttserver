import Board from "../../../src/lib/board";

describe("lib board tests", () => {
  it("test non-winning conditions", () => {
    let board = new Board();
    board = board.makeMove(1, "O");
    board = board.makeMove(2, "X");
    board = board.makeMove(3, "O");
    expect(board.winningPlayer()).toBe("");
  });

  it("test winning conditions row", () => {
    let board = new Board();
    board = board.makeMove(1, "O");
    board = board.makeMove(2, "O");
    board = board.makeMove(3, "O");
    expect(board.winningPlayer()).toBe("O");
  });

  it("test winning conditions column", () => {
    let board = new Board();
    board = board.makeMove(1, "X");
    board = board.makeMove(4, "X");
    board = board.makeMove(7, "X");
    expect(board.winningPlayer()).toBe("X");
  });

  it("test winning conditions diagonal", () => {
    let board = new Board();
    board = board.makeMove(1, "O");
    board = board.makeMove(5, "O");
    board = board.makeMove(9, "O");
    expect(board.winningPlayer()).toBe("O");
  });
});
