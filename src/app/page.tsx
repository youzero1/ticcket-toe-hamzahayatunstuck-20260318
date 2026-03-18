'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

type Player = 'X' | 'O';
type Cell = Player | null;
type Winner = Player | 'Draw' | null;

interface Scores {
  xWins: number;
  oWins: number;
  draws: number;
}

interface HistoryEntry {
  id: number;
  winner: 'X' | 'O' | 'Draw';
  datePlayed: string;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board: Cell[]): { winner: Player; line: number[] } | null {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: combo };
    }
  }
  return null;
}

function isDraw(board: Cell[]): boolean {
  return board.every((cell) => cell !== null);
}

export default function Home() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState<Scores>({ xWins: 0, oWins: 0, draws: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [savingResult, setSavingResult] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        setScores(data.scores);
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch scores:', err);
    } finally {
      setLoadingScores(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const saveResult = useCallback(async (result: 'X' | 'O' | 'Draw') => {
    setSavingResult(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: result }),
      });
      if (res.ok) {
        await fetchScores();
      }
    } catch (err) {
      console.error('Failed to save result:', err);
    } finally {
      setSavingResult(false);
    }
  }, [fetchScores]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || gameOver) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const result = calculateWinner(newBoard);
      if (result) {
        setWinner(result.winner);
        setWinningLine(result.line);
        setGameOver(true);
        saveResult(result.winner);
      } else if (isDraw(newBoard)) {
        setWinner('Draw');
        setGameOver(true);
        saveResult('Draw');
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    },
    [board, currentPlayer, gameOver, saveResult]
  );

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
    setGameOver(false);
  }, []);

  const getStatusMessage = () => {
    if (winner === 'Draw') return "It's a Draw!";
    if (winner) return `Player ${winner} Wins! 🎉`;
    return `Player ${currentPlayer}'s Turn`;
  };

  return (
    <main>
      <div className={styles.container}>
        <h1 className={styles.title}>Tic Tac Toe</h1>

        <div className={styles.scoreBoard}>
          <div className={`${styles.scoreItem} ${styles.scoreX}`}>
            <span className={styles.scoreLabel}>Player X</span>
            <span className={styles.scoreValue}>{scores.xWins}</span>
          </div>
          <div className={`${styles.scoreItem} ${styles.scoreDraw}`}>
            <span className={styles.scoreLabel}>Draws</span>
            <span className={styles.scoreValue}>{scores.draws}</span>
          </div>
          <div className={`${styles.scoreItem} ${styles.scoreO}`}>
            <span className={styles.scoreLabel}>Player O</span>
            <span className={styles.scoreValue}>{scores.oWins}</span>
          </div>
        </div>

        <div
          className={`${styles.status} ${
            winner === 'Draw'
              ? styles.statusDraw
              : winner === 'X'
              ? styles.statusX
              : winner === 'O'
              ? styles.statusO
              : currentPlayer === 'X'
              ? styles.statusTurnX
              : styles.statusTurnO
          }`}
        >
          {getStatusMessage()}
          {savingResult && <span className={styles.saving}> Saving...</span>}
        </div>

        <div className={styles.board}>
          {board.map((cell, index) => (
            <button
              key={index}
              className={`${styles.cell} ${
                cell === 'X' ? styles.cellX : cell === 'O' ? styles.cellO : ''
              } ${winningLine.includes(index) ? styles.cellWin : ''} ${
                !cell && !gameOver ? styles.cellHover : ''
              }`}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameOver}
              aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ''}`}
            >
              {cell && (
                <span className={styles.cellContent}>{cell}</span>
              )}
            </button>
          ))}
        </div>

        <button className={styles.restartButton} onClick={resetGame}>
          Restart Game
        </button>

        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>Recent Games</h2>
          {loadingScores ? (
            <p className={styles.loadingText}>Loading history...</p>
          ) : history.length === 0 ? (
            <p className={styles.loadingText}>No games played yet. Start playing!</p>
          ) : (
            <div className={styles.historyList}>
              {history.slice(0, 10).map((entry) => (
                <div key={entry.id} className={styles.historyItem}>
                  <span
                    className={`${styles.historyWinner} ${
                      entry.winner === 'X'
                        ? styles.historyX
                        : entry.winner === 'O'
                        ? styles.historyO
                        : styles.historyDraw
                    }`}
                  >
                    {entry.winner === 'Draw' ? 'Draw' : `Player ${entry.winner} Won`}
                  </span>
                  <span className={styles.historyDate}>
                    {new Date(entry.datePlayed).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
