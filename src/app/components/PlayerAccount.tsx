"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useAnchorProgram } from '../utils/AnchorClient';
import { BN, web3 } from '@coral-xyz/anchor';

export const PlayerAccount = () => {
    const program = useAnchorProgram();
    const wallet = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const initializePlayer = async () => {
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

            // Initialize the player account with an initial balance of 100
            await program.rpc.initializePlayer(new BN(100), {
                accounts: {
                    playerAccount: playerAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                },
            });

            // Fetch the player account data
            const playerAccount = await program.account.playerAccount.fetch(playerAccountPda);
            setBalance(playerAccount.balance.toNumber());
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error("Failed to initialize player account:", err);
            setError("Failed to initialize player account. It may already exist.");
        }
    };

    return (
        <div>
            <button onClick={initializePlayer}>Initialize Player</button>
            {balance !== null && <p>Balance: {balance}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};