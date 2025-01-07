"use client"; // Mark this file as a Client Component

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { BN } from "@project-serum/anchor";
import { useProgram, ProgramProvider } from "./utils/programProvider";
import { WalletProviderWrapper } from "./utils/WalletProvider";
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import styles from './style.module.css'; // Import CSS Module

const Home = () => {
  const { publicKey, connected, wallet, connecting } = useWallet();
  const { program } = useProgram();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState("");
  const [result, setResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isDeterminingResult, setIsDeterminingResult] = useState(false);

  // Debug wallet connection
  useEffect(() => {
    console.log("Wallet connection state:", {
      publicKey: publicKey?.toBase58(),
      program: program,
      connected,
      wallet: wallet?.adapter?.name,
      connecting,
    });
  }, [publicKey, connected, wallet, connecting]);

  // Fetch player account data
  const fetchPlayerAccount = async (playerAccountPDA: PublicKey) => {
    if (!program) {
      console.error("Program is not defined.");
      return;
    }

    try {
      console.log("Fetching player account data for PDA:", playerAccountPDA.toBase58());
      const account = await program.account.playerAccount.fetch(playerAccountPDA);
      console.log("Player account data:", account);
      setBalance(account.balance.toNumber()); // Ensure balance is being set correctly
    } catch (error) {
      console.error("Error fetching player account:", error);
    }
  };

  // Initialize player account
  const initializePlayer = async () => {
    if (!publicKey || isInitializing || !program) {
      alert("Wallet is not connected or program is not available.");
      return;
    }

    setIsInitializing(true);
    try {
      const [playerAccountPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("player_account"), publicKey.toBuffer()],
        program.programId
      );

      console.log("Initializing PlayerAccount PDA:", playerAccountPDA.toBase58());

      const tx = await program.methods
        .initializePlayer(new BN(1000)) // Initialize with 1000 lamports (0.000001 SOL)
        .accounts({
          playerAccount: playerAccountPDA,
          player: publicKey,
        })
        .rpc();

      console.log("Transaction signature:", tx);
      alert("Player account initialized successfully!");

      await fetchPlayerAccount(playerAccountPDA);
    } catch (error) {
      console.error("Error initializing player:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Place a bet
  const placeBet = async () => {
    const amount = parseFloat(betAmount);
    if (!publicKey || amount <= 0 || isPlacingBet || !program) {
      alert("Please enter a valid bet amount.");
      return;
    }

    setIsPlacingBet(true);
    try {
      const [playerAccountPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("player_account"), publicKey.toBuffer()],
        program.programId
      );

      console.log("Placing Bet PlayerAccount PDA:", playerAccountPDA.toBase58());

      const tx = await program.methods
        .placeBet(new BN(amount * 1e9)) // Convert SOL to lamports (1 SOL = 1e9 lamports)
        .accounts({
          playerAccount: playerAccountPDA,
          player: publicKey,
        })
        .rpc();

      console.log("Transaction signature:", tx);
      alert("Bet placed successfully!");

      await fetchPlayerAccount(playerAccountPDA);
    } catch (error) {
      console.error("Error placing bet:", error);
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Determine game result
  const determineResult = async () => {
    if (!publicKey || isDeterminingResult || !program) {
      alert("Wallet is not connected or program is not available.");
      return;
    }

    setIsDeterminingResult(true);
    try {
      const [playerAccountPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("player_account"), publicKey.toBuffer()],
        program.programId
      );

      console.log("Determining Result PlayerAccount PDA:", playerAccountPDA.toBase58());

      const tx = await program.methods
        .determineResult(new BN(1)) // Example: Pass a value to determine the result
        .accounts({
          playerAccount: playerAccountPDA,
          player: publicKey,
        })
        .rpc();

      console.log("Transaction signature:", tx);
      alert("Game result determined successfully!");

      await fetchPlayerAccount(playerAccountPDA);
    } catch (error) {
      console.error("Error determining result:", error);
    } finally {
      setIsDeterminingResult(false);
    }
  };

  // Fetch player account on mount or when publicKey changes
  useEffect(() => {
    if (publicKey && program) {
      console.log("PublicKey and program are available. Fetching player account...");
      const fetchData = async () => {
        try {
          const [playerAccountPDA] = await PublicKey.findProgramAddress(
            [Buffer.from("player_account"), publicKey.toBuffer()],
            program.programId
          );
          console.log("PlayerAccount PDA:", playerAccountPDA.toBase58());
          await fetchPlayerAccount(playerAccountPDA);
        } catch (error) {
          console.error("Error deriving playerAccountPDA:", error);
        }
      };
      fetchData();
    } else {
      console.log("PublicKey or program is not available.");
    }
  }, [publicKey, program]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Plinko Casino</h1>

      <div className={styles.walletButton}>
        <WalletMultiButton />
      </div>

      {connected ? (
        <div>
          <p>Your Balance: {balance / 1e9} SOL</p> {/* Convert lamports to SOL */}

          <button onClick={initializePlayer} disabled={isInitializing || !program}>
            {isInitializing ? "Initializing..." : "Initialize Player"}
          </button>

          <div>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet Amount"
              min="0"
            />
            <button
              onClick={placeBet}
              disabled={isPlacingBet || !program || betAmount === "" || parseFloat(betAmount) <= 0}
            >
              {isPlacingBet ? "Placing Bet..." : "Place Bet"}
            </button>
          </div>

          <button
            onClick={determineResult}
            disabled={isDeterminingResult || !program}
          >
            {isDeterminingResult ? "Determining Result..." : "Determine Result"}
          </button>

          {result && <p>Result: {result}</p>}
        </div>
      ) : (
        <p>Please connect your wallet to play.</p>
      )}
    </div>
  );
};

export default function Page() {
  return (
    <WalletProviderWrapper>
      <ProgramProvider>
        <Home />
      </ProgramProvider>
    </WalletProviderWrapper>
  );
}