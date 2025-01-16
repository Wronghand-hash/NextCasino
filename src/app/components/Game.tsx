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

  const rows = 14; // Number of rows in the Plinko board
  const pegs = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: row + 1 }, (_, col) => ({
      x: 50 + (col - row / 2) * 10, // Adjust x spacing
      y: (row + 1) * 10, // Adjust y spacing
    }))
  )
    .slice(2) // Skip the first two rows
    .flat();

  // Define the slots at the bottom with their respective multipliers
  const slots = [8.9, 3, 14, 1.1, 1, 0.5, 1, 1.1, 14, 8, 8.9];

  // Calculate the slot index based on the ball's final x position
  const getSlotIndex = (x: number): number => {
    const slotWidth = 100 / slots.length; // Width of each slot in percentage
    return Math.floor(x / slotWidth);
  };

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

          // Determine the slot the ball landed in
          const slotIndex = getSlotIndex(prev.x);
          const multiplier = slots[slotIndex];

          // Determine if the player wins or loses
          const result = multiplier > 1 ? "Win" : "Lose";
          setGameResult(result);

          // Show toast message based on result
          if (result === "Win") {
            toast.success(`You won! Multiplier: ${multiplier}x. Winnings: ${betAmount * multiplier} SOL.`);
          } else {
            toast.error(`You lost! Multiplier: ${multiplier}x. Loss: ${betAmount} SOL.`);
          }

          // Fetch updated player balance
          fetchPlayerBalance();

          // Call the determine_result instruction if the player wins
          if (result === "Win" && program && publicKey) {
            const [gameAccountPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("game_account"), publicKey.toBuffer()],
              program.programId
            );

            program.methods
              .determineResult(new BN(multiplier * 1e9)) // Convert multiplier to lamports
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

          // Lock the game after the ball drops (deferred to next event loop tick)
          setTimeout(() => {
            setIsBetPlaced(false);
          }, 0);
        }

        return { x: newX, y: newY };
      });
    }, 30);

    return () => clearInterval(interval); // Cleanup interval on unmount
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
      {/* Plinko Board (Always Visible) */}
      <div style={styles.plinkoBoard} ref={plinkoBoardRef}>
        {/* Render pegs */}
        {pegs.map((peg, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute" as const, // Explicitly type as 'Position'
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
            position: "absolute" as const, // Explicitly type as 'Position'
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

      {/* Render slots at the bottom */}
      <div style={styles.slotsContainer}>
        {slots.map((slot, idx) => (
          <div key={idx} style={styles.slot}>
            {slot}x
          </div>
        ))}
      </div>

      {/* Drop Ball Button (Disabled Until Bet is Placed) */}
      <button
        onClick={dropBall}
        disabled={!isBetPlaced || isDropping} // Disable if no bet is placed or ball is dropping
        style={styles.dropBallButton}
      >
        {isDropping ? "Dropping Ball..." : "Drop Ball"}
      </button>

      {/* Game Result */}
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