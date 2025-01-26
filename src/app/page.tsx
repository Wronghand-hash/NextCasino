"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PlayerAccount } from "./components/PlayerAccount";
import { PlaceBet } from "./components/PlaceBet";
import { useWallet } from "@solana/wallet-adapter-react";
import DepositFunds from "./components/DepositFunds";
import { useState } from "react";
import { useAnchorProgram } from "./utils/AnchorClient";
import { PublicKey } from "@solana/web3.js";
import { Game } from "./components/Game";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast } from "react-toastify";
import { TopUpGameAccount } from "./components/TopUpGameAccount";
import { CheckBalance } from "./components/CheckBalance";

const Home = () => {
  const { connected, wallet } = useWallet();
  const program = useAnchorProgram();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [playerBalance, setPlayerBalance] = useState<number | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false); // Allow dropping ball after bet
  const [gameAccountBalance, setGameAccountBalance] = useState<number | null>(null);

  const fetchPlayerBalance = async () => {
    if (!wallet?.adapter?.publicKey || !program) return;

    try {
      const balance = await program.provider.connection.getBalance(wallet.adapter.publicKey);
      setPlayerBalance(balance / web3.LAMPORTS_PER_SOL); // Convert lamports to SOL
    } catch (err) {
      console.error("Failed to fetch player balance:", err);
    }
  };

  const fetchGameAccountBalance = async () => {
    if (!wallet?.adapter?.publicKey || !program) return;

    const [gameAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_account"), wallet.adapter.publicKey.toBuffer()],
      program.programId
    );

    try {
      const balance = await program.provider.connection.getBalance(gameAccountPda);
      setGameAccountBalance(balance / web3.LAMPORTS_PER_SOL); // Convert lamports to SOL
    } catch (err) {
      console.error("Failed to fetch game account balance:", err);
    }
  };

  const initializeGame = async () => {
    if (!wallet?.adapter?.publicKey || !program) {
      toast.error("Wallet not connected or program not loaded.");
      return;
    }

    const [gameAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game_account"), wallet.adapter.publicKey.toBuffer()],
      program.programId
    );

    try {
      // Check if the game account already exists
      try {
        await program.account.gameAccount.fetch(gameAccountPda);
        toast.info("Game account already exists.");
        return;
      } catch (err) {
        console.log("Game account does not exist. Initializing...");
      }

      const initialFunding = 0.1 * web3.LAMPORTS_PER_SOL;
      const tx = await program.methods
        .initializeGame(new BN(initialFunding))
        .accounts({
          gameAccount: gameAccountPda,
          player: wallet.adapter.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      toast.success(`Game account initialized! Transaction: ${tx}`);
      await fetchGameAccountBalance();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to initialize game account: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to the Casino</h1>
      <div style={styles.walletButtonContainer}>
        <WalletMultiButton style={styles.walletButton} />
      </div>
      {connected && program ? (
        <div style={styles.content}>
          <div style={styles.leftColumn}>
            <PlayerAccount
              balance={playerBalance}
              fetchPlayerBalance={fetchPlayerBalance}
              program={program}
            />
            <DepositFunds
              fetchPlayerBalance={fetchPlayerBalance}
              program={program}
            />
            <PlaceBet
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              isBetPlaced={isBetPlaced}
              setIsBetPlaced={setIsBetPlaced}
              program={program}
              fetchPlayerBalance={fetchPlayerBalance}
              initializeGame={initializeGame} // Pass the initializeGame function
            />
            <TopUpGameAccount
              program={program}
              fetchGameAccountBalance={fetchGameAccountBalance}
            />
            <CheckBalance
              program={program}
              gameAccountBalance={gameAccountBalance}
              fetchGameAccountBalance={fetchGameAccountBalance}
            />
          </div>
          <div style={styles.rightColumn}>
            <Game
              betAmount={betAmount}
              isBetPlaced={isBetPlaced}
              setIsBetPlaced={setIsBetPlaced}
              fetchPlayerBalance={fetchPlayerBalance}
              program={program}
            />
          </div>
        </div>
      ) : (
        <p style={styles.connectWalletMessage}>Please connect your wallet to start playing.</p>
      )}
    </div>
  );
};

export default Home;

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: "100vh",
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    padding: "20px",
    overflow: "hidden",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "10px",
  },
  walletButtonContainer: {
    marginBottom: "20px",
  },
  walletButton: {
    backgroundColor: "#4CAF50",
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  connectWalletMessage: {
    fontSize: "1rem",
    color: "#cccccc",
    marginTop: "20px",
  },
  content: {
    display: "flex",
    flexDirection: "row" as "row", // Horizontal layout
    gap: "20px", // Space between columns
    width: "100%",
    maxWidth: "1200px", // Limit width for better readability
    justifyContent: "center", // Center the columns
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "10px", // Space between components
    width: "30%", // Smaller width for left column
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column" as "column",
    width: "60%", // Larger width for right column (Game component)
  },
};