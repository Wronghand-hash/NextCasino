"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { SetStateAction, useState } from "react";
import { useAnchorProgram } from "../utils/AnchorClient";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

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
            setIsBetPlaced(true);
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
                    Bet Amount: {betAmount}
                    <Slider
                        min={1}
                        max={100}
                        value={betAmount}
                        onChange={(value: any) => setBetAmount(value as any)}
                        disabled={loading}
                        style={styles.slider}
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
            {error && <p style={styles.error}>{error}</p>}
            <ToastContainer />
        </div>
    );
};

const styles = {
    container: {
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        marginBottom: "20px",
    },
    title: {
        fontSize: "24px",
        marginBottom: "16px",
        color: "#333",
        textAlign: "center" as const,
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "10px",
        marginBottom: "16px",
    },
    label: {
        fontSize: "16px",
        color: "#333",
    },
    slider: {
        width: "100%",
        marginTop: "10px",
    },
    button: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
    },
    error: {
        color: "red",
        fontSize: "14px",
        textAlign: "center" as const,
    },
};