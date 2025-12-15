const style = document.createElement("style");
style.textContent = `
  .highlight {
    outline: 3px solid yellow;
  }
`;
document.head.appendChild(style);

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");

let board = [];          
let selectedIndex = null;
let whiteToMove = true;
let moves = [];

const PIECES = {
  "P": "♙",
  "N": "♘",
  "B": "♗",
  "R": "♖",
  "Q": "♕",
  "K": "♔",
  "p": "♟",
  "n": "♞",
  "b": "♝",
  "r": "♜",
  "q": "♛",
  "k": "♚"
};

// Legale zetten voor elk stuktype (geen schaak/schaakmat/rokade/en passant)
function getLegalMoves(index, piece) {
  const moves = [];
  const row = Math.floor(index / 8);
  const col = index % 8;

  function add(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return;
    const target = r * 8 + c;
    if (isWhite(piece) && isWhite(board[target])) return;
    if (isBlack(piece) && isBlack(board[target])) return;
    moves.push(target);
  }

  if (piece === "N" || piece === "n") {
    const knightMoves = [
      [row+2, col+1], [row+2, col-1],
      [row-2, col+1], [row-2, col-1],
      [row+1, col+2], [row+1, col-2],
      [row-1, col+2], [row-1, col-2]
    ];
    knightMoves.forEach(m => add(m[0], m[1]));
    return moves;
  }

  function slide(directions) {
    directions.forEach(dir => {
      let r = row + dir[0];
      let c = col + dir[1];
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = r * 8 + c;
        if (board[target]) {
          if (isWhite(piece) && isBlack(board[target])) moves.push(target);
          if (isBlack(piece) && isWhite(board[target])) moves.push(target);
          break;
        }
        moves.push(target);
        r += dir[0];
        c += dir[1];
      }
    });
  }

  if (piece === "R" || piece === "r") {
    slide([[1,0],[-1,0],[0,1],[0,-1]]);
    return moves;
  }

  if (piece === "B" || piece === "b") {
    slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
    return moves;
  }

  if (piece === "Q" || piece === "q") {
    slide([[1,0],[-1,0],[0,1],[0,-1]]);
    slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
    return moves;
  }

  if (piece === "K" || piece === "k") {
    const kingMoves = [
      [row+1, col], [row-1, col], [row, col+1], [row, col-1],
      [row+1,col+1], [row+1,col-1], [row-1,col+1], [row-1,col-1]
    ];
    kingMoves.forEach(m => add(m[0], m[1]));
    return moves;
  }

  if (piece === "P") {
    if (!board[index - 8]) moves.push(index - 8);
    if (row === 6 && !board[index-8] && !board[index-16]) moves.push(index - 16);
    if (isBlack(board[index-7])) moves.push(index - 7);
    if (isBlack(board[index-9])) moves.push(index - 9);
    return moves;
  }

  if (piece === "p") {
    if (!board[index + 8]) moves.push(index + 8);
    if (row === 1 && !board[index+8] && !board[index+16]) moves.push(index + 16);
    if (isWhite(board[index+7])) moves.push(index + 7);
    if (isWhite(board[index+9])) moves.push(index + 9);
    return moves;
  }

  return moves;
}

function findKing(isWhiteSide) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p) continue;
    if (isWhiteSide && p === "K") return i;
    if (!isWhiteSide && p === "k") return i;
  }
  return null;
}

function squareAttacked(index, byWhite) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p) continue;
    if (byWhite && !isWhite(p)) continue;
    if (!byWhite && !isBlack(p)) continue;

    const moves = getLegalMoves(i, p);
    if (moves.includes(index)) return true;
  }
  return false;
}

function isInCheck(isWhiteSide) {
  const kingIndex = findKing(isWhiteSide);
  if (kingIndex === null) return false;
  return squareAttacked(kingIndex, !isWhiteSide);
}

function hasLegalMoves(isWhiteSide) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p) continue;
    if (isWhiteSide && !isWhite(p)) continue;
    if (!isWhiteSide && !isBlack(p)) continue;

    const moves = getLegalMoves(i, p);
    for (const m of moves) {
      const backupFrom = board[i];
      const backupTo = board[m];

      board[m] = backupFrom;
      board[i] = "";

      const stillInCheck = isInCheck(isWhiteSide);

      board[i] = backupFrom;
      board[m] = backupTo;

      if (!stillInCheck) return true;
    }
  }
  return false;
}

function isWhite(piece) {
  return piece && piece === piece.toUpperCase();
}

function isBlack(piece) {
  return piece && piece === piece.toLowerCase();
}

// startopstelling: alle stukken
function initialBoard() {
  return [
    "r","n","b","q","k","b","n","r",
    "p","p","p","p","p","p","p","p",
    "","","","","","","","",
    "","","","","","","","",
    "","","","","","","","",
    "","","","","","","","",
    "P","P","P","P","P","P","P","P",
    "R","N","B","Q","K","B","N","R"
  ];
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let i = 0; i < 64; i++) {
    const square = document.createElement("div");
    square.classList.add("square");
    square.style.width = "70px";
    square.style.height = "70px";
    square.style.fontSize = "48px";

    const row = Math.floor(i / 8);
    const col = i % 8;

    if ((row + col) % 2 === 0) {
      square.style.backgroundColor = "#e0c68c";   // lichte kleur
    } else {
      square.style.backgroundColor = "#b58863";   // donkere kleur
    }

    const piece = board[i];
    if (piece) {
      square.textContent = PIECES[piece] || "";
    }

    if (i === selectedIndex) {
      square.classList.add("selected");
    }
    if (selectedIndex !== null) {
      const piece = board[selectedIndex];
      const legalMoves = getLegalMoves(selectedIndex, piece);
      if (legalMoves.includes(i)) {
        square.classList.add("highlight");
      }
    }

    square.addEventListener("click", () => onSquareClick(i));
    boardEl.appendChild(square);
  }

  updateStatus();
}

function updateStatus() {
  const speler = whiteToMove ? "Wit" : "Zwart";
  statusEl.textContent = `Beurt: ${speler}`;
  if (isInCheck(whiteToMove)) {
    statusEl.textContent += " (Schaak!)";
  }
}

function onSquareClick(index) {
  const piece = board[index];

  // als nog niets geselecteerd:
  if (selectedIndex === null) {
    if (!piece) return;

    // alleen stukken van de speler die aan zet is
    if (whiteToMove && !isWhite(piece)) return;
    if (!whiteToMove && !isBlack(piece)) return;

    selectedIndex = index;
    renderBoard();
    return;
  }

  // klik opnieuw op hetzelfde veld = deselecteren
  if (selectedIndex === index) {
    selectedIndex = null;
    renderBoard();
    return;
  }

  
  movePiece(selectedIndex, index);
}

function movePiece(from, to) {
  const movingPiece = board[from];
  if (!movingPiece) {
    selectedIndex = null;
    renderBoard();
    return;
  }

  const legal = getLegalMoves(from, movingPiece);
  if (!legal.includes(to)) {
    selectedIndex = null;
    renderBoard();
    return;
  }

  const notation = PIECES[movingPiece] + " " + from + "→" + to;
  moves.push(notation);

  const list = document.getElementById("movesList");
  const li = document.createElement("li");
  li.textContent = notation;
  list.appendChild(li);

  board[to] = movingPiece;
  board[from] = "";
  whiteToMove = !whiteToMove;
  selectedIndex = null;

  const opponentIsWhite = whiteToMove;
  const opponentInCheck = isInCheck(opponentIsWhite);
  const opponentHasMoves = hasLegalMoves(opponentIsWhite);

  if (opponentInCheck && !opponentHasMoves) {
    statusEl.textContent = opponentIsWhite ? "Zwart wint – Schaakmat!" : "Wit wint – Schaakmat!";
  }

  renderBoard();
}

function resetGame() {
  board = initialBoard();
  whiteToMove = true;
  selectedIndex = null;
  renderBoard();
}

// events
resetBtn.addEventListener("click", resetGame);

// start
resetGame();