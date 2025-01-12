"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useAnchorProgram } from '../utils/AnchorClient';
import { BN, web3 } from '@coral-xyz/anchor';

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
            const [playerAccountPda] = await web3.PublicKey.findProgramAddress(
                [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            const playerAccount = await program.account.playerAccount.fetch(playerAccountPda);
            setPlayerBalance(playerAccount.balance.toNumber());
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        }
    };

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
            const [playerAccountPda] = await web3.PublicKey.findProgramAddress(
                [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            const [gameAccountPda] = await web3.PublicKey.findProgramAddress(
                [Buffer.from('game_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            await program.rpc.placeBet(new BN(betAmount), {
                accounts: {
                    playerAccount: playerAccountPda,
                    gameAccount: gameAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                },
            });

            await fetchPlayerBalance();
            alert('Bet placed successfully!');
        } catch (err) {
            console.error("Failed to place bet:", err);
            if (err instanceof web3.SendTransactionError) {
                console.log("Transaction Logs:", err.logs);
            }
            setError("Failed to place bet.");
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
                {loading ? 'Placing Bet...' : 'Place Bet'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {playerBalance !== null && <p>Your Balance: {playerBalance}</p>}
        </div>
    );
};
