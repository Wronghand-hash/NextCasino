"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useAnchorProgram } from "../utils/AnchorClient";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

interface PlaceBetProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  isBetPlaced: boolean;
  setIsBetPlaced: (isPlaced: boolean) => void;
}

export const PlaceBet: React.FC<PlaceBetProps> = ({
  betAmount,
  setBetAmount,
  isBetPlaced,
  setIsBetPlaced,
}) => {
  const program = useAnchorProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState<boolean>(false);

  const initializeGame = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!program) {
      toast.error("Program not loaded. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const [gameAccountPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .initializeGame()
        .accounts({
          gameAccount: gameAccountPda,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast.success(`Game account initialized! Transaction: ${tx}`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to initialize game account: ${err.message}`);
    } finally {
      setLoading(false);
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
      const [gameAccountPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .placeBet(new BN(betAmount))
        .accounts({
          gameAccount: gameAccountPda,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast.success(`Bet placed! Transaction: ${tx}`);
      setIsBetPlaced(true);
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
            min={1}
            max={100}
            value={betAmount}
            onChange={(value) => setBetAmount(value as number)}
            disabled={loading}
            style={styles.slider}
          />
        </label>
        <button
          onClick={initializeGame}
          disabled={loading || !wallet.connected}
          style={styles.button}
        >
          {loading ? "Initializing Game..." : "Initialize Game"}
        </button>
        <button
          onClick={placeBet}
          disabled={loading || !wallet.connected}
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