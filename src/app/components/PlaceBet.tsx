"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { CasinoPlinkoProgram } from "../utils/AnchorClient";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { PublicKey } from "@solana/web3.js";

interface PlaceBetProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  isBetPlaced: boolean;
  setIsBetPlaced: (isPlaced: boolean) => void;
  program: CasinoPlinkoProgram | null;
  fetchPlayerBalance: () => Promise<void>;
  initializeGame: () => Promise<void>;
}

export const PlaceBet: React.FC<PlaceBetProps> = ({
  betAmount,
  setBetAmount,
  isBetPlaced,
  setIsBetPlaced,
  program,
  fetchPlayerBalance,
  initializeGame,
}) => {
  const wallet = useWallet();
  const [loading, setLoading] = useState<boolean>(false);

  const resetGame = async () => {
    if (!wallet.connected || !wallet.publicKey || !program) {
      toast.error("Please connect your wallet and ensure the program is loaded.");
      return;
    }

    try {
      const [gameAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .resetGame()
        .accounts({
          gameAccount: gameAccountPda,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast.success(`Game reset! Transaction: ${tx}`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to reset game: ${err.message}`);
    }
  };

  const placeBet = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!program) {
      toast.error("Program not loaded. Please try again.");
      return;
    }

    if (betAmount <= 0) {
      toast.error("Bet amount must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const [gameAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
        program.programId
      );

      let gameAccount;
      try {
        // Try to fetch the game account
        gameAccount = await program.account.gameAccount.fetch(gameAccountPda);
        console.log("Game Account State:", gameAccount);
      } catch (err) {
        // If the game account does not exist, initialize it
        console.log("Game account does not exist. Initializing...");
        await initializeGame();
        gameAccount = await program.account.gameAccount.fetch(gameAccountPda);
      }

      if (
        gameAccount.bet_amount !== 0 ||
        !(gameAccount.result as any).pending // Check for the "pending" key
      ) {
        await resetGame();
      }
      // Convert bet amount to lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = Math.floor(betAmount * web3.LAMPORTS_PER_SOL);

      const tx = await program.methods
        .placeBet(new BN(lamports)) // Use `place_bet` (snake_case)
        .accounts({
          gameAccount: gameAccountPda,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast.success(`Bet placed! Transaction: ${tx}`);
      setIsBetPlaced(true);
      await fetchPlayerBalance(); // Refresh balance after placing bet
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to place bet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Place Your Bet</h2>
      <div style={styles.inputGroup}>
        <label style={styles.label}>
          Bet Amount: {betAmount} SOL
          <Slider
            min={0.1}
            max={10}
            step={0.1}
            value={betAmount}
            onChange={(value) => setBetAmount(value as number)}
            disabled={loading || isBetPlaced}
            style={styles.slider}
          />
        </label>
        <button
          onClick={placeBet}
          disabled={loading || !wallet.connected || isBetPlaced}
          style={styles.button}
        >
          {loading ? "Placing Bet..." : "Place Bet"}
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    marginBottom: "20px",
    maxWidth: "400px",
    margin: "0 auto",
  },
  title: {
    fontSize: "24px",
    marginBottom: "16px",
    color: "#333",
    textAlign: "center",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "16px",
    color: "#333",
  },
  slider: {
    width: "100%",
    marginTop: "10px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "center",
    width: "100%",
  },
};