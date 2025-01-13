"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useAnchorProgram } from "../utils/AnchorClient";
import { BN, web3 } from "@coral-xyz/anchor";

export const PlaceBet = () => {
    const program = useAnchorProgram();
    const wallet = useWallet();
    const [betAmount, setBetAmount] = useState<number>(10);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [playerBalance, setPlayerBalance] = useState<number | null>(null);

    // Fetch player balance
    const fetchPlayerBalance = async () => {
        if (!wallet.publicKey || !program) return;

        const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
            [Buffer.from("player_account"), wallet.publicKey.toBuffer()],
            program.programId
        );

        try {
            const playerAccount = await program.account.playerAccount.fetch(playerAccountPda);
            setPlayerBalance(playerAccount.balance.toNumber());
        } catch (err) {
            console.error("Failed to fetch player balance:", err);
            setError("Failed to fetch player balance. Please initialize your account.");
        }
    };

    // Check if an account exists
    const accountExists = async (connection: web3.Connection, publicKey: web3.PublicKey): Promise<boolean> => {
        const accountInfo = await connection.getAccountInfo(publicKey);
        return accountInfo !== null;
    };

    // Initialize the player account
    const initializePlayer = async () => {
        if (!wallet.publicKey || !program) {
            setError("Wallet not connected or program not loaded");
            return;
        }

        try {
            const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_account"), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Check if the player account already exists
            const playerAccountExists = await accountExists(program.provider.connection, playerAccountPda);
            if (playerAccountExists) {
                setError("Player account already exists.");
                return;
            }

            // Initialize the player account with an initial balance
            await program.methods
                .initializePlayer(new BN(1000)) // Initial balance of 1000
                .accounts({
                    playerAccount: playerAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            setError(null); // Clear any previous errors
            alert("Player account initialized!");
            await fetchPlayerBalance();
        } catch (err) {
            console.error("Failed to initialize player account:", err);
            setError("Failed to initialize player account.");
        }
    };

    // Initialize the game account
    const initializeGame = async () => {
        if (!wallet.publicKey || !program) {
            setError("Wallet not connected or program not loaded");
            return;
        }

        try {
            const [gameAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Check if the game account already exists
            const gameAccountExists = await accountExists(program.provider.connection, gameAccountPda);
            if (gameAccountExists) {
                setError("Game account already exists.");
                return;
            }

            // Initialize the game account with an initial balance
            await program.methods
                .initializeGame(new BN(1000)) // Initial balance of 1000
                .accounts({
                    gameAccount: gameAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            setError(null); // Clear any previous errors
            alert("Game account initialized!");
        } catch (err) {
            console.error("Failed to initialize game account:", err);
            setError("Failed to initialize game account.");
        }
    };

    // Place a bet
    const placeBet = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            setError("Please connect your wallet first.");
            return;
        }

        if (!program) {
            setError("Program not loaded. Please try again.");
            return;
        }

        if (betAmount <= 0) {
            setError("Bet amount must be greater than 0.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_account"), wallet.publicKey.toBuffer()],
                program.programId
            );

            const [gameAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Ensure game account is initialized
            const gameAccountExists = await accountExists(program.provider.connection, gameAccountPda);
            if (!gameAccountExists) {
                setError("Game account not initialized. Please initialize your game first.");
                return;
            }

            // Place the bet
            await program.methods
                .placeBet(new BN(betAmount))
                .accounts({
                    playerAccount: playerAccountPda,
                    gameAccount: gameAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            await fetchPlayerBalance();
            alert("Bet placed successfully!");
        } catch (err) {
            console.error("Failed to place bet:", err);
            setError("Failed to place bet. Please check your balance and try again.");
        } finally {
            setLoading(false);
        }
    };

    // Determine the result of the game
    const determineResult = async (result: boolean) => {
        if (!wallet.connected || !wallet.publicKey || !program) {
            setError("Please connect your wallet first.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [gameAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
                program.programId
            );

            const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_account"), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Determine the result
            await program.methods
                .determineResult(result)
                .accounts({
                    gameAccount: gameAccountPda,
                    playerAccount: playerAccountPda,
                    player: wallet.publicKey,
                })
                .rpc();

            await fetchPlayerBalance();
            alert(`Game result determined: ${result ? "Win" : "Loss"}`);
        } catch (err) {
            console.error("Failed to determine result:", err);
            setError("Failed to determine result. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <label>
                Bet Amount:
                <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="1"
                    disabled={loading}
                />
            </label>
            <button onClick={placeBet} disabled={loading || !wallet.connected}>
                {loading ? "Placing Bet..." : "Place Bet"}
            </button>
            <button onClick={initializePlayer} disabled={loading || !wallet.connected}>
                Initialize Player
            </button>
            <button onClick={initializeGame} disabled={loading || !wallet.connected}>
                Initialize Game
            </button>
            <button onClick={() => determineResult(true)} disabled={loading || !wallet.connected}>
                Simulate Win
            </button>
            <button onClick={() => determineResult(false)} disabled={loading || !wallet.connected}>
                Simulate Loss
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {playerBalance !== null && <p>Your Balance: {playerBalance}</p>}
        </div>
    );
};