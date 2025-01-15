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

export default function Home() {
  const { connected, wallet } = useWallet();
  const program = useAnchorProgram();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [playerBalance, setPlayerBalance] = useState<number | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false); // Allow dropping ball after bet

  const fetchPlayerBalance = async () => {
    if (!wallet?.adapter?.publicKey || !program) return;

    const [playerAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_account"), wallet.adapter.publicKey.toBuffer()],
      program.programId
    );

    try {
      const playerAccount = await program.account.playerAccount.fetch(playerAccountPda);
      setPlayerBalance(playerAccount.balance.toNumber());
    } catch (err) {
      console.error("Failed to fetch player balance:", err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to the Casino</h1>
      <div style={styles.walletButtonContainer}>
        <WalletMultiButton style={styles.walletButton} />
      </div>
      {connected ? (
        <>
          <PlayerAccount balance={playerBalance} fetchPlayerBalance={fetchPlayerBalance} />
          <DepositFunds fetchPlayerBalance={fetchPlayerBalance} />
          <PlaceBet
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            fetchPlayerBalance={fetchPlayerBalance}
            isBetPlaced={isBetPlaced}
            setIsBetPlaced={setIsBetPlaced}
          />
          {isBetPlaced && (
            <Game
              betAmount={betAmount}
              isBetPlaced={isBetPlaced}
              setIsBetPlaced={setIsBetPlaced}
              fetchPlayerBalance={fetchPlayerBalance}
            />
          )}
        </>
      ) : (
        <p style={styles.connectWalletMessage}>Please connect your wallet to start playing.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as "column",
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
  walletButtonContainer: {
    marginBottom: "20px",
  },
  walletButton: {
    backgroundColor: "#4CAF50",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  connectWalletMessage: {
    fontSize: "1.2rem",
    color: "#cccccc",
  },
};