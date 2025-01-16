"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CasinoPlinkoProgram } from "../utils/AnchorClient"; // Import the correct program type

interface DepositFundsProps {
  fetchPlayerBalance: () => Promise<void>;
  program: CasinoPlinkoProgram | null; // Add program prop
}

const DepositFunds: React.FC<DepositFundsProps> = ({ fetchPlayerBalance, program }) => {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleDeposit = async () => {
    if (!publicKey || !program) {
      toast.error("Wallet not connected or program not loaded.");
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }

    setLoading(true);

    try {
      // Convert the deposit amount to lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = Math.floor(depositAmount * web3.LAMPORTS_PER_SOL);

      // Find the player account PDA
      const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("player_account"), publicKey.toBuffer()],
        program.programId
      );

      console.log("Player Account PDA:", playerAccountPda.toString());

      // Call the deposit_funds instruction
      const tx = await program.methods
        .depositFunds(new BN(lamports))
        .accounts({
          playerAccount: playerAccountPda,
          player: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction:", tx);

      toast.success(`Deposit successful! Transaction: ${tx}`);
      setAmount("");

      // Refresh the player's balance after deposit
      await fetchPlayerBalance();
    } catch (error) {
      console.error("Deposit failed:", error);
      toast.error(`Deposit failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Deposit Funds</h2>
      <input
        type="number"
        placeholder="Enter amount in SOL"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={styles.input}
      />
      <button
        onClick={handleDeposit}
        disabled={loading || !publicKey}
        style={styles.button}
      >
        {loading ? "Processing..." : "Deposit"}
      </button>
      <ToastContainer />
    </div>
  );
};

// Define styles with proper TypeScript types
const styles = {
  container: {
    display: "flex" as const,
    flexDirection: "column" as const, // Explicitly set as a valid FlexDirection value
    alignItems: "center" as const,
    padding: "20px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxWidth: "400px",
    margin: "0 auto",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default DepositFunds;