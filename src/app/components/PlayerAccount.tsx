"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useAnchorProgram } from '../utils/AnchorClient';
import { BN, web3 } from '@coral-xyz/anchor';

export const PlayerAccount = () => {
    const program = useAnchorProgram();
    const wallet = useWallet();
    const [balance, setBalance] = useState<number | null>(null);

    const initializePlayer = async () => {
        if (!wallet.publicKey) return;

        // Derive the PDA for the player account
        const [playerAccountPda] = await web3.PublicKey.findProgramAddress(
            [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
            program.programId
        );

        // Initialize the player account
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
    };

    return (
        <div>
            <button onClick={initializePlayer}>Initialize Player</button>
            {balance !== null && <p>Balance: {balance}</p>}
        </div>
    );
};