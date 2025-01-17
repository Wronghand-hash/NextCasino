"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { CasinoPlinkoProgram } from "../utils/AnchorClient";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PublicKey } from "@solana/web3.js";

interface PlayerAccountProps {
  balance: number | null;
  fetchPlayerBalance: () => Promise<void>;
  program: CasinoPlinkoProgram | null;
}

export const PlayerAccount: React.FC<PlayerAccountProps> = ({
  balance,
  fetchPlayerBalance,
  program,
}) => {
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
  
    try {
      // Derive the game account PDA with the correct seed and bump
      const [gameAccountPda, gameAccountBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_game_account")], // Ensure this matches the seed in the Anchor program
        program.programId
      );
  
      console.log("Game Account PDA:", gameAccountPda.toBase58());
      console.log("Game Account Bump:", gameAccountBump);
  
      const initialFunding = 1 * web3.LAMPORTS_PER_SOL; // 1 SOL initial funding
  
      const tx = await program.methods
        .initializeGame(new BN(initialFunding))
        .accounts({
          gameAccount: gameAccountPda,
          payer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
  
      console.log("Game Initialized! Transaction:", tx);
      toast.success(`Game initialized! Transaction: ${tx}`);
    } catch (err: any) {
      console.error("Error initializing game:", err);
      toast.error(`Failed to initialize game: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Player Account</h2>
      <div style={styles.balanceContainer}>
        <p style={styles.balanceText}>
          Current Balance: {balance !== null ? `${balance} SOL` : "Loading..."}
        </p>
      </div>
      <div style={styles.buttonGroup}>
        <button
          onClick={initializeGame}
          disabled={loading || !wallet.connected}
          style={styles.button}
        >
          {loading ? "Initializing..." : "Initialize Player"}
        </button>
      </div>
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
  balanceContainer: {
    marginBottom: "16px",
    textAlign: "center",
  },
  balanceText: {
    fontSize: "16px",
    color: "#333",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
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