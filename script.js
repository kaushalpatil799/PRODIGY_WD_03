
const cells = [...document.querySelectorAll(".cell")];
const modeButtons = [...document.querySelectorAll(".mode-button")];

const turnSymbol = document.getElementById("turnSymbol");
const turnMessage = document.getElementById("turnMessage");
const gameStatus = document.getElementById("gameStatus");
const resultIcon = document.getElementById("resultIcon");
const resultText = document.getElementById("resultText");

const scoreXElement = document.getElementById("scoreX");
const scoreOElement = document.getElementById("scoreO");
const scoreDrawElement = document.getElementById("scoreDraw");
const nameXElement = document.getElementById("nameX");
const nameOElement = document.getElementById("nameO");

const newGameButton = document.getElementById("newGameButton");
const resetButton = document.getElementById("resetButton");
const themeButton = document.getElementById("themeButton");

const winningPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameMode = "two";
let gameOver = false;
let computerThinking = false;
let computerTimer = null;
let roundId = 0;

let scores = {
    X: 0,
    O: 0,
    draw: 0
};

function renderScores() {
    scoreXElement.textContent = scores.X;
    scoreOElement.textContent = scores.O;
    scoreDrawElement.textContent = scores.draw;
}

function renderTurn() {
    turnSymbol.textContent = currentPlayer;
    turnSymbol.style.color = currentPlayer === "X"
        ? "var(--cyan)"
        : "var(--pink)";

    const playerName = gameMode === "ai" && currentPlayer === "O"
        ? "Computer"
        : `Player ${currentPlayer}`;

    turnMessage.textContent = `${playerName}'s turn`;
}

function renderStatus(status) {
    gameStatus.textContent = status;
}

function showResult(icon, message) {
    resultIcon.textContent = icon;
    resultText.textContent = message;
}

function renderBoard() {
    cells.forEach((cell, index) => {
        const mark = board[index];

        cell.textContent = mark;
        cell.classList.toggle("mark-x", mark === "X");
        cell.classList.toggle("mark-o", mark === "O");
        cell.classList.remove("winner");

        cell.disabled = Boolean(mark) || gameOver || computerThinking;

        const description = mark || "empty";
        cell.setAttribute(
            "aria-label",
            `Cell ${index + 1}, ${description}`
        );
    });
}

function getWinningPattern(position) {
    return winningPatterns.find(pattern =>
        pattern.includes(position) &&
        board[position] !== "" &&
        pattern.every(index => board[index] === board[position])
    );
}

function findWinner(state) {
    for (const pattern of winningPatterns) {
        const [a, b, c] = pattern;

        if (
            state[a] &&
            state[a] === state[b] &&
            state[b] === state[c]
        ) {
            return {
                player: state[a],
                pattern
            };
        }
    }

    return null;
}

function finishGame(winner, pattern = []) {
    gameOver = true;
    computerThinking = false;

    if (computerTimer !== null) {
        clearTimeout(computerTimer);
        computerTimer = null;
    }

    if (winner) {
        scores[winner]++;

        pattern.forEach(index => {
            cells[index].classList.add("winner");
        });

        const winnerName = gameMode === "ai" && winner === "O"
            ? "Computer"
            : `Player ${winner}`;

        renderStatus("WINNER");
        showResult("🏆", `${winnerName} wins the game!`);
        turnMessage.textContent = `${winnerName} won!`;
    } else {
        scores.draw++;

        renderStatus("DRAW");
        showResult("🤝", "It's a draw! Great game.");
        turnMessage.textContent = "Match drawn!";
    }

    renderScores();
    renderBoard();
}

function checkGame(position) {
    const winningResult = findWinner(board);

    if (winningResult) {
        finishGame(winningResult.player, winningResult.pattern);
        return true;
    }

    if (board.every(cell => cell !== "")) {
        finishGame(null);
        return true;
    }

    return false;
}

function makeMove(position) {
    if (
        gameOver ||
        computerThinking ||
        board[position] !== ""
    ) {
        return;
    }

    board[position] = currentPlayer;

    if (checkGame(position)) {
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";

    renderBoard();
    renderTurn();

    if (gameMode === "ai" && currentPlayer === "O") {
        computerThinking = true;
        renderStatus("THINKING");
        showResult("🤖", "Computer is choosing a move...");
        renderBoard();

        const activeRound = roundId;

        computerTimer = setTimeout(() => {
            computerTimer = null;

            if (activeRound !== roundId || gameOver) {
                return;
            }

            const bestMove = findBestMove();

            computerThinking = false;

            if (bestMove !== -1) {
                makeComputerMove(bestMove);
            }
        }, 350);
    } else {
        renderStatus("PLAYING");
        showResult("✦", "Your move. Choose an empty square.");
    }
}

function makeComputerMove(position) {
    if (gameOver || board[position] !== "") {
        return;
    }

    board[position] = "O";

    if (checkGame(position)) {
        return;
    }

    currentPlayer = "X";

    renderBoard();
    renderTurn();
    renderStatus("PLAYING");
    showResult("✦", "Your turn! Find your next move.");
}

function minimax(state, depth, isMaximizing) {
    const result = findWinner(state);

    if (result?.player === "O") {
        return 10 - depth;
    }

    if (result?.player === "X") {
        return depth - 10;
    }

    if (state.every(cell => cell !== "")) {
        return 0;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;

        for (let index = 0; index < 9; index++) {
            if (state[index] === "") {
                state[index] = "O";
                const score = minimax(state, depth + 1, false);
                state[index] = "";
                bestScore = Math.max(bestScore, score);
            }
        }

        return bestScore;
    }

    let bestScore = Infinity;

    for (let index = 0; index < 9; index++) {
        if (state[index] === "") {
            state[index] = "X";
            const score = minimax(state, depth + 1, true);
            state[index] = "";
            bestScore = Math.min(bestScore, score);
        }
    }

    return bestScore;
}

function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let index = 0; index < 9; index++) {
        if (board[index] === "") {
            board[index] = "O";

            const score = minimax(board, 0, false);

            board[index] = "";

            if (score > bestScore) {
                bestScore = score;
                bestMove = index;
            }
        }
    }

    return bestMove;
}

function startNewGame() {
    roundId++;

    if (computerTimer !== null) {
        clearTimeout(computerTimer);
        computerTimer = null;
    }

    board = Array(9).fill("");
    currentPlayer = "X";
    gameOver = false;
    computerThinking = false;

    renderBoard();
    renderTurn();
    renderStatus("READY");
    showResult("✦", "Make your first move!");
}

function resetScores() {
    scores = {
        X: 0,
        O: 0,
        draw: 0
    };

    renderScores();
    startNewGame();
    showResult("↻", "Scores reset. Start a new match!");
}

function setGameMode(mode) {
    gameMode = mode;

    modeButtons.forEach(button => {
        const selected = button.dataset.mode === mode;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });

    nameXElement.textContent = mode === "ai" ? "YOU · X" : "PLAYER X";
    nameOElement.textContent = mode === "ai" ? "CPU · O" : "PLAYER O";

    startNewGame();
    showResult(
        mode === "ai" ? "🤖" : "👥",
        mode === "ai"
            ? "You are X. Computer plays O."
            : "Player X starts the game."
    );
}

function toggleTheme() {
    const isLight = document.body.classList.toggle("light-theme");

    themeButton.textContent = isLight ? "☾" : "☼";
    themeButton.setAttribute(
        "aria-label",
        isLight ? "Switch to dark theme" : "Switch to light theme"
    );
}

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        makeMove(index);
    });
});

modeButtons.forEach(button => {
    button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("active"))
    );

    button.addEventListener("click", () => {
        setGameMode(button.dataset.mode);
    });
});

newGameButton.addEventListener("click", startNewGame);
resetButton.addEventListener("click", resetScores);
themeButton.addEventListener("click", toggleTheme);

renderScores();
renderBoard();
renderTurn();
renderStatus("READY");
showResult("✦", "Make your first move!");