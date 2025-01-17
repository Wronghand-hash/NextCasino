"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { CasinoPlinkoProgram } from "../utils/AnchorClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PublicKey } from "@solana/web3.js";

interface CheckBalanceProps {
  program: CasinoPlinkoProgram | null;
  fetchGameAccountBalance: () => Promise<void>;
  gameAccountBalance: number | null;
}

export const CheckBalance: React.FC<CheckBalanceProps> = ({ program, fetchGameAccountBalance, gameAccountBalance }) => {
  const wallet = useWallet();
  const [loading, setLoading] = useState<boolean>(false);

  const checkBalance = async () => {
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
      await fetchGameAccountBalance(); // Use the passed function to fetch balance
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to check balance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Check Game Account Balance</h2>
      <div style={styles.inputGroup}>
        <button
          onClick={checkBalance}
          disabled={loading || !wallet.connected}
          style={styles.button}
        >
          {loading ? "Checking Balance..." : "Check Balance"}
        </button>
        {gameAccountBalance !== null && (
          <p style={styles.balanceText}>Balance: {gameAccountBalance} SOL</p>
        )}
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
  balanceText: {
    fontSize: "16px",
    color: "#333",
    textAlign: "center",
  },
};