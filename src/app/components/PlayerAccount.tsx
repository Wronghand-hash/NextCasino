"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useAnchorProgram } from "../utils/AnchorClient";
import { web3 } from "@coral-xyz/anchor";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const PlayerAccount = () => {
  const program = useAnchorProgram();
  const wallet = useWallet();
  const [loading, setLoading] = useState<boolean>(false);

  const initializePlayer = async () => {
    if (!wallet.publicKey || !program) {
      toast.error("Wallet not connected or program not loaded.");
      return;
    }

    setLoading(true);

    try {
      const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("player_account"), wallet.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .initializePlayer()
        .accounts({
          playerAccount: playerAccountPda,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast.success("Player account initialized!");
    } catch (err: any) {
      console.error("Initialization failed:", err);
      toast.error(`Initialization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Player Account</h2>
      <div style={styles.buttonGroup}>
        <button
          onClick={initializePlayer}
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