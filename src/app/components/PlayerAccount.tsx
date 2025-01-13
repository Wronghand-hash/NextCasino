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
    const [loading, setLoading] = useState<boolean>(false);

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

        setLoading(true);
        setError(null);

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
            alert("Player account initialized successfully!");
        } catch (err) {
            console.error("Failed to initialize player account:", err);
            setError("Failed to initialize player account. It may already exist.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch the player's balance
    const fetchPlayerBalance = async () => {
        if (!wallet.publicKey || !program) return;

        setLoading(true);
        setError(null);

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
        } finally {
            setLoading(false);
        }
    };

    // Close the player account
    const closePlayerAccount = async () => {
        if (!wallet.publicKey || !program) {
            setError("Wallet not connected or program not loaded");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [playerAccountPda] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
                program.programId
            );

            // Close the player account
            await program.methods
                .closePlayerAccount()
                .accounts({
                    playerAccount: playerAccountPda,
                    player: wallet.publicKey,
                })
                .rpc();

            setBalance(null);
            alert("Player account closed successfully!");
        } catch (err) {
            console.error("Failed to close player account:", err);
            setError("Failed to close player account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={initializePlayer} disabled={loading || !wallet.connected}>
                {loading ? "Initializing..." : "Initialize Player"}
            </button>
            <button onClick={fetchPlayerBalance} disabled={loading || !wallet.connected}>
                Fetch Balance
            </button>
            <button onClick={closePlayerAccount} disabled={loading || !wallet.connected}>
                Close Player Account
            </button>
            {balance !== null && <p>Balance: {balance}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};