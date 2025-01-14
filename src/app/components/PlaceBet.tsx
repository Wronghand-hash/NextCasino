"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { SetStateAction, useState } from "react";
import { useAnchorProgram } from "../utils/AnchorClient";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Game from "./Game"; // Import the Game component

interface PlaceBetProps {
    betAmount: number;
    setBetAmount: (amount: number) => void;
    fetchPlayerBalance: () => Promise<void>;
    isBetPlaced: boolean;
    setIsBetPlaced: (isPlaced: boolean) => void;
}

export const PlaceBet: React.FC<PlaceBetProps> = ({
    betAmount,
    setBetAmount,
    fetchPlayerBalance,
    isBetPlaced,
    setIsBetPlaced,
}) => {
    const program = useAnchorProgram();
    const wallet = useWallet();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [playerBalance, setPlayerBalance] = useState<number | null>(null);

    // Fetch player balance
    const fetchPlayerBalanceLocal = async () => {
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
            toast.success("Player account initialized!");
            await fetchPlayerBalance();
        } catch (err) {
            console.error("Failed to initialize player account:", err);
            setError("Failed to initialize player account.");
            toast.error("Failed to initialize player account.");
        }
    };

    // Place a bet
    const placeBet = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            setError("Please connect your wallet first.");
            toast.error("Please connect your wallet first.");
            return;
        }

        if (!program) {
            setError("Program not loaded. Please try again.");
            toast.error("Program not loaded. Please try again.");
            return;
        }

        if (betAmount <= 0) {
            setError("Bet amount must be greater than 0.");
            toast.error("Bet amount must be greater than 0.");
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

            // Check if the game account exists
            const gameAccountInfo = await program.provider.connection.getAccountInfo(gameAccountPda);
            if (!gameAccountInfo) {
                // Initialize the game account if it doesn't exist
                await program.methods
                    .initializeGame(new BN(1000)) // Initial balance of 1000
                    .accounts({
                        gameAccount: gameAccountPda,
                        player: wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                    })
                    .rpc();
                toast.success("Game account initialized!");
            }

            // Place the bet
            const tx = await program.methods
                .placeBet(new BN(betAmount))
                .accounts({
                    playerAccount: playerAccountPda,
                    gameAccount: gameAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            console.log("Transaction:", tx);
            toast.success(`Bet placed successfully! Transaction: ${tx}`);
            setIsBetPlaced(true); // Set bet placed to true
            await fetchPlayerBalance();
        } catch (err) {
            console.error("Failed to place bet:", err);
            setError("Failed to place bet. Please check your balance and try again.");
            toast.error(`Failed to place bet: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Place Your Bet</h2>
            <div style={styles.inputGroup}>
                <label style={styles.label}>
                    Bet Amount:
                    <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min="1"
                        disabled={loading}
                        style={styles.input}
                    />
                </label>
                <button
                    onClick={placeBet}
                    disabled={loading || !wallet.connected}
                    style={styles.button}
                >
                    {loading ? "Placing Bet..." : "Place Bet"}
                </button>
            </div>
            <div style={styles.buttonGroup}>
                <button
                    onClick={initializePlayer}
                    disabled={loading || !wallet.connected}
                    style={styles.button}
                >
                    Initialize Player
                </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            {playerBalance !== null && <p style={styles.balance}>Your Balance: {playerBalance}</p>}

            {/* Render the Game component */}
            {isBetPlaced && (
                <Game
                    betAmount={betAmount}
                    wallet={wallet}
                    program={program}
                    fetchPlayerBalance={fetchPlayerBalance}
                    isBetPlaced={isBetPlaced} setIsBetPlaced={function (value: SetStateAction<boolean>): void {
                        throw new Error("Function not implemented.");
                    }} />
            )}

            {/* Toast notifications */}
            <ToastContainer />
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        marginBottom: '20px',
    },
    title: {
        fontSize: '24px',
        marginBottom: '16px',
        color: '#333',
        textAlign: 'center' as const, // Explicitly set to 'center'
    },
    inputGroup: {
        display: 'flex',
        gap: '10px',
        marginBottom: '16px',
    },
    label: {
        fontSize: '16px',
        color: '#333',
    },
    input: {
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
        marginBottom: '16px',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    balance: {
        fontSize: '18px',
        color: '#333',
        textAlign: 'center' as const, // Explicitly set to 'center'
    },
    error: {
        color: 'red',
        fontSize: '14px',
        textAlign: 'center' as const, // Explicitly set to 'center'
    },
};