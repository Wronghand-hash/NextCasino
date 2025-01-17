"use client";

import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CasinoPlinkoProgram } from "../utils/AnchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN, web3 } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

interface GameProps {
  betAmount: number;
  isBetPlaced: boolean;
  setIsBetPlaced: (isPlaced: boolean) => void;
  fetchPlayerBalance: () => Promise<void>;
  program: CasinoPlinkoProgram | null;
}

export const Game: React.FC<GameProps> = ({
  betAmount,
  isBetPlaced,
  setIsBetPlaced,
  fetchPlayerBalance,
  program,
}) => {
  const { publicKey } = useWallet();
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 50, y: 0 });
  const plinkoBoardRef = useRef<HTMLDivElement>(null);

  const rows = 14;
  const pegs = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: row + 1 }, (_, col) => ({
      x: 50 + (col - row / 2) * 10,
      y: (row + 1) * 10,
    }))
  )
    .slice(2)
    .flat();

  const slots = [8.9, 3, 14, 1.1, 1, 1.1, 1, 1.1, 14, 8, 8.9];

  const getSlotIndex = (x: number): number => {
    const slotWidth = 100 / slots.length;
    return Math.floor(x / slotWidth);
  };

  useEffect(() => {
    if (!isDropping) return;

    const interval = setInterval(() => {
      setBallPosition((prev) => {
        const newY = prev.y + 2;
        const bias = Math.random() < 0.8 ? 0.3 : -0.3;
        const newX = prev.x + (Math.random() - 0.5 + bias) * 4;

        if (newY >= 90) {
          clearInterval(interval);
          setIsDropping(false);

          let slotIndex;
          if (Math.random() < 0.8) {
            const winningSlots = slots
              .map((multiplier, index) => ({ multiplier, index }))
              .filter((slot) => slot.multiplier > 1);
            const randomWinningSlot = winningSlots[Math.floor(Math.random() * winningSlots.length)];
            slotIndex = randomWinningSlot.index;
          } else {
            const losingSlots = slots
              .map((multiplier, index) => ({ multiplier, index }))
              .filter((slot) => slot.multiplier <= 1);
            const randomLosingSlot = losingSlots[Math.floor(Math.random() * losingSlots.length)];
            slotIndex = randomLosingSlot.index;
          }

          const multiplier = slots[slotIndex];
          const result = multiplier > 1 ? "Win" : "Lose";
          setGameResult(result);

          if (result === "Win") {
            toast.success(`You won! Multiplier: ${multiplier}x. Winnings: ${betAmount * multiplier} SOL.`);
          } else {
            toast.error(`You lost! Multiplier: ${multiplier}x. Loss: ${betAmount} SOL.`);
          }

          fetchPlayerBalance();

          if (result === "Win" && program && publicKey) {
            const [gameAccountPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("global_game_account")],
              program.programId
            );

            program.methods
              .determineResult(new BN(multiplier * 1e9))
              .accounts({
                gameAccount: gameAccountPda,
                player: publicKey,
                systemProgram: web3.SystemProgram.programId,
              })
              .rpc()
              .then(() => {
                toast.success("Winnings transferred to your wallet!");
              })
              .catch((err: any) => {
                console.error("Failed to determine result:", err);
                toast.error(`Failed to transfer winnings: ${err.message}`);
              });
          }

          setTimeout(() => {
            setIsBetPlaced(false);
          }, 0);
        }

        return { x: newX, y: newY };
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isDropping, betAmount, fetchPlayerBalance, setIsBetPlaced, program, publicKey]);

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
    <div style={styles.container}>
      <h2 style={styles.title}>Plinko Game</h2>
      <div style={styles.plinkoBoard} ref={plinkoBoardRef}>
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
            transition: "top 0.1s linear, left 0.1s linear",
          }}
        />
      </div>

      <div style={styles.slotsContainer}>
        {slots.map((slot, idx) => (
          <div key={idx} style={styles.slot}>
            {slot}x
          </div>
        ))}
      </div>

      <button
        onClick={dropBall}
        disabled={!isBetPlaced || isDropping}
        style={styles.dropBallButton}
      >
        {isDropping ? "Dropping Ball..." : "Drop Ball"}
      </button>

      {gameResult && (
        <p style={styles.resultText}>
          Result: {gameResult}
        </p>
      )}

      <ToastContainer />
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    padding: "20px",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "20px",
  },
  plinkoBoard: {
    position: "relative" as const, // Explicitly type as 'Position'
    width: "100%",
    height: "400px",
    overflow: "hidden" as const,
    backgroundColor: "#333",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  slotsContainer: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "600px",
    marginBottom: "20px",
  },
  slot: {
    flex: 1,
    textAlign: "center" as const,
    padding: "10px",
    backgroundColor: "#444",
    borderRadius: "5px",
    margin: "0 5px",
    color: "#fff",
    fontSize: "14px",
  },
  dropBallButton: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "20px",
  },
  resultText: {
    marginTop: "20px",
    fontSize: "18px",
    color: "#fff",
  },
};