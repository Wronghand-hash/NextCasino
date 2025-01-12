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

    const fetchPlayerBalance = async () => {
        if (!wallet.publicKey || !program) return;

        try {
            const playerAccountPda = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_account"), wallet.publicKey.toBuffer()],
                program.programId
            )[0];

            const playerAccount = await program.account.playerAccount.fetch(playerAccountPda);
            setPlayerBalance(playerAccount.balance.toNumber());
        } catch (err) {
            console.error("Failed to fetch player balance:", err);
            setError("Player account not found. Please initialize your account.");
        }
    };

    const placeBet = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            setError("Please connect your wallet first.");
            return;
        }

        if (!program || !program.programId) {
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
            const playerAccountPda = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("player_account"), wallet.publicKey.toBuffer()],
                program.programId
            )[0];

            const gameAccountPda = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("game_account"), wallet.publicKey.toBuffer()],
                program.programId
            )[0];

            await program.rpc.placeBet(new BN(betAmount), {
                accounts: {
                    playerAccount: playerAccountPda,
                    gameAccount: gameAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                },
            });

            await fetchPlayerBalance().catch((err) => {
                console.error("Failed to update balance:", err);
                setError("Bet placed, but balance update failed.");
            });

            alert("Bet placed successfully!");
        } catch (err) {
            console.error("Failed to place bet:", err);
            setError("Failed to place bet. Please check your balance and try again.");
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
            {error && <p style={{ color: "red" }}>{error}</p>}
            {playerBalance !== null && <p>Your Balance: {playerBalance}</p>}
        </div>
    );
};
