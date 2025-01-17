"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { CasinoPlinkoProgram } from "../utils/AnchorClient";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PublicKey } from "@solana/web3.js";

interface TopUpGameAccountProps {
    program: CasinoPlinkoProgram | null;
}

export const TopUpGameAccount: React.FC<TopUpGameAccountProps> = ({ program }) => {
    const wallet = useWallet();
    const [amount, setAmount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const topUpGameAccount = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            toast.error("Please connect your wallet first.");
            return;
        }

        if (!program) {
            toast.error("Program not loaded. Please try again.");
            return;
        }

        if (amount <= 0) {
            toast.error("Amount must be greater than 0.");
            return;
        }

        setLoading(true);

        try {
            const [gameAccountPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
                program.programId
            );

            const lamports = Math.floor(amount * web3.LAMPORTS_PER_SOL);

            const tx = await program.methods
                .topUpGameAccount(new BN(lamports))
                .accounts({
                    gameAccount: gameAccountPda,
                    payer: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            toast.success(`Game account topped up! Transaction: ${tx}`);
        } catch (err: any) {
            console.error(err);
            toast.error(`Failed to top up game account: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Top Up Game Account</h2>
            <div style={styles.inputGroup}>
                <label style={styles.label}>
                    Amount (SOL):
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value))}
                        style={styles.input}
                    />
                </label>
                <button
                    onClick={topUpGameAccount}
                    disabled={loading || !wallet.connected}
                    style={styles.button}
                >
                    {loading ? "Topping Up..." : "Top Up"}
                </button>
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
    label: {
        fontSize: "16px",
        color: "#333",
    },
    input: {
        padding: "8px",
        fontSize: "14px",
        borderRadius: "4px",
        border: "1px solid #ddd",
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