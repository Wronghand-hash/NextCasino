"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useAnchorProgram } from '../utils/AnchorClient';
import { BN, web3 } from '@coral-xyz/anchor';

export const PlaceBet = () => {
    const program = useAnchorProgram();
    const wallet = useWallet();
    const [betAmount, setBetAmount] = useState<number>(10);

    const placeBet = async () => {
        if (!wallet.publicKey) return;
        const [gameAccountPda] = await web3.PublicKey.findProgramAddress(
            [Buffer.from('game_account'), wallet.publicKey.toBuffer()],
            program.programId
        );

        await program.rpc.placeBet(new BN(betAmount), {
            accounts: {
                playerAccount: gameAccountPda,
                gameAccount: gameAccountPda,
                player: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            },
        });

        alert('Bet placed successfully!');
    };

    return (
        <div>
            <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
            />
            <button onClick={placeBet}>Place Bet</button>
        </div>
    );
};