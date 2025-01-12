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
            // Derive the PDA for the player account
            const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Check if the player account already exists
            const playerAccountExists = await accountExists(program.provider.connection, playerAccountPda);
            if (playerAccountExists) {
                setError("Player account already exists.");
                return;
            }

            // Initialize the player account with an initial balance of 100
            await program.methods
                .initializePlayer(new BN(100)) // Initial balance of 100
                .accounts({
                    playerAccount: playerAccountPda,
                    player: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            // Fetch the player account data
            const playerAccount = await program.account.playerAccount.fetch(playerAccountPda);
            setBalance(playerAccount.balance.toNumber());
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error("Failed to initialize player account:", err);
            setError("Failed to initialize player account. It may already exist.");
        }
    };

    // Fetch the player's balance
    const fetchPlayerBalance = async () => {
        if (!wallet.publicKey || !program) return;

        try {
            const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            const playerAccount = await program.account.playerAccount.fetch(playerAccountPda);
            setBalance(playerAccount.balance.toNumber());
        } catch (err) {
            console.error("Failed to fetch player balance:", err);
            setError("Failed to fetch player balance. Please initialize your account.");
        }
    };

    return (
        <div>
            <button onClick={initializePlayer}>Initialize Player</button>
            <button onClick={fetchPlayerBalance}>Fetch Balance</button>
            {balance !== null && <p>Balance: {balance}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};