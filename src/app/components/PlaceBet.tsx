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

    const placeBet = async () => {
        if (!wallet.publicKey || !program) {
            setError("Wallet not connected or program not loaded");
            return;
        }

        try {
            // Derive the PDA for the player account
            const [playerAccountPda] = await web3.PublicKey.findProgramAddress(
                [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Derive the PDA for the game account
            const [gameAccountPda] = await web3.PublicKey.findProgramAddress(
                [Buffer.from('game_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Place the bet
            await program.rpc.placeBet(new BN(betAmount), {
                accounts: {
                    playerAccount: playerAccountPda,
                    gameAccount: gameAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                },
            });

            setError(null);
            alert('Bet placed successfully!');
        } catch (err) {
            console.error("Failed to place bet:", err);
            setError("Failed to place bet. Please check your balance and try again.");
        }
    };

    return (
        <div>
            <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1" // Ensure the bet amount is at least 1
            />
            <button onClick={placeBet}>Place Bet</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};