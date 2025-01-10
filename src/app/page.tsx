"use client"; // Mark this file as a Client Component

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { BN } from "@project-serum/anchor";
import { ProgramProvider, useProgram } from "./utils/programProvider"; // Import useProgram
import { WalletProviderWrapper } from "./utils/WalletProvider"; // Import WalletProviderWrapper
import { useState, useEffect } from "react";
import { PublicKey, Connection, SystemProgram, Transaction } from "@solana/web3.js"; // Import SystemProgram
import styles from './style.module.css'; // Import CSS Module

const Home = () => {
  const { publicKey, connected, wallet, connecting } = useWallet();
  const { program } = useProgram(); // Use the useProgram hook
  const [balance, setBalance] = useState(0); // In-game balance (lamports)
  const [walletBalance, setWalletBalance] = useState(0); // Wallet balance (SOL)
  const [betAmount, setBetAmount] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isDeterminingResult, setIsDeterminingResult] = useState(false);

  const network = 'https://api.devnet.solana.com'; // Use devnet for testing
  const connection = new Connection(network, 'confirmed');

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

  // Fetch the player's wallet balance
  const fetchWalletBalance = async () => {
    if (!publicKey) {
      console.error('Wallet is not connected');
      return;
    }

    try {
      // Get the balance in lamports
      const lamportsBalance = await connection.getBalance(publicKey);
      console.log('Balance in lamports:', lamportsBalance);

      // Convert lamports to SOL
      const solBalance = lamportsBalance / 1_000_000_000;
      setWalletBalance(solBalance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
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
      // Derive the PDA for the player's account using findProgramAddressSync
      const [playerAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("player_account"), publicKey.toBuffer()],
        program.programId
      );

      console.log("Derived Accounts:");
      console.log("PlayerAccount PDA:", playerAccountPDA.toBase58());
      console.log("Player Public Key:", publicKey.toBase58());
      console.log("System Program ID:", SystemProgram.programId.toBase58());

      // Call the Anchor program's initializePlayer method
      const tx = await program.methods
        .initializePlayer(new BN(1000)) // Initialize with 1000 lamports
        .accounts({
          player_account: playerAccountPDA, // The player's account PDA
          player: publicKey, // The player's public key
          system_program: SystemProgram.programId, // System program
        })
        .rpc();

      console.log("Transaction successful. Signature:", tx);
      alert("Player account initialized successfully!");

      // Optionally fetch and update the player's account state
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

  // Fetch wallet balance when the wallet is connected or publicKey changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchWalletBalance();
    } else {
      setWalletBalance(0); // Reset wallet balance if wallet is disconnected
    }
  }, [connected, publicKey]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Plinko Casino</h1>

      <div className={styles.walletButton}>
        <WalletMultiButton />
      </div>

      {connected ? (
        <div>
          <p>Your Wallet Balance: {walletBalance} SOL</p> {/* Wallet balance in SOL */}
          <p>Your In-Game Balance: {balance / 1e9} SOL</p> {/* In-game balance in SOL */}

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