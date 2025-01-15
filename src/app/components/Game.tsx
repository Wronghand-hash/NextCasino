"use client";

import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface GameProps {
  betAmount: number;
  isBetPlaced: boolean;
  setIsBetPlaced: (isPlaced: boolean) => void;
  fetchPlayerBalance: () => Promise<void>;
}

export const Game: React.FC<GameProps> = ({
  betAmount,
  isBetPlaced,
  setIsBetPlaced,
  fetchPlayerBalance,
}) => {
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 50, y: 0 });
  const plinkoBoardRef = useRef<HTMLDivElement>(null);

  const rows = 8; // Number of rows in the Plinko board
  const pegs = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: row + 1 }, (_, col) => ({
      x: 50 + (col - row / 2) * 10, // Adjust x spacing
      y: (row + 1) * 10, // Adjust y spacing
    }))
  ).flat();

  // Handle ball drop and result
  useEffect(() => {
    if (!isDropping) return;

    const interval = setInterval(() => {
      setBallPosition((prev) => {
        const newY = prev.y + 2; // Move ball down
        const newX = prev.x + (Math.random() - 0.5) * 4; // Random horizontal movement

        if (newY >= 90) {
          clearInterval(interval);
          setIsDropping(false);
          const result = Math.random() > 0.5 ? "Win" : "Lose"; // Random result
          setGameResult(result);

          // Show toast message based on result
          if (result === "Win") {
            toast.success(`You won! ${betAmount} tokens added to your balance.`);
          } else {
            toast.error(`You lost! ${betAmount} tokens deducted from your balance.`);
          }

          // Fetch updated player balance
          fetchPlayerBalance();
        }

        return { x: newX, y: newY };
      });
    }, 30);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [isDropping, betAmount, fetchPlayerBalance]);

  // Lock the game after the ball drops
  useEffect(() => {
    if (!isDropping && gameResult !== null) {
      setIsBetPlaced(false); // Lock the game after the ball drops
    }
  }, [isDropping, gameResult, setIsBetPlaced]);

  const dropBall = () => {
    if (!isBetPlaced) {
      toast.error("Please place a bet before dropping the ball.");
      return;
    }

    setIsDropping(true);
    setGameResult(null);
    setBallPosition({ x: 50, y: 0 });
  };

  return (
    <div>
      <h2>Plinko Game</h2>
      {/* Plinko Board (Always Visible) */}
      <div style={{ position: "relative", width: "100%", height: "400px", overflow: "hidden" }} ref={plinkoBoardRef}>
        {/* Render pegs */}
        {pegs.map((peg, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: `${peg.y}%`,
              left: `${peg.x}%`,
              width: "10px",
              height: "10px",
              backgroundColor: "#fff",
              borderRadius: "50%",
            }}
          />
        ))}
        {/* Render ball */}
        <div
          style={{
            position: "absolute",
            top: `${ballPosition.y}%`,
            left: `${ballPosition.x}%`,
            width: "20px",
            height: "20px",
            backgroundColor: "red",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            transition: "top 0.1s linear, left 0.1s linear", // Smooth ball movement
          }}
        />
      </div>

      {/* Drop Ball Button (Disabled Until Bet is Placed) */}
      <button
        onClick={dropBall}
        disabled={!isBetPlaced || isDropping} // Disable if no bet is placed or ball is dropping
        style={{
          padding: "10px 20px",
          backgroundColor: isBetPlaced ? "#007bff" : "#ccc",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: isBetPlaced ? "pointer" : "not-allowed",
          marginTop: "20px",
        }}
      >
        {isDropping ? "Dropping Ball..." : "Drop Ball"}
      </button>

      {/* Game Result */}
      {gameResult && (
        <p style={{ marginTop: "20px", fontSize: "18px", color: gameResult === "Win" ? "green" : "red" }}>
          Result: {gameResult}
        </p>
      )}

      <ToastContainer />
    </div>
  );
};