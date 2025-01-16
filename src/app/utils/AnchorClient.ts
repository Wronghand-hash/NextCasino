import { Program, Provider, web3, Idl, AnchorProvider, BN } from '@coral-xyz/anchor';
import IDL from "../idl/casino_plinko.json"; // Adjust the path to your IDL
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

// Define the PlayerAccount type
type PlayerAccount = {
    player: web3.PublicKey;
    balance: BN;
};

// Define the GameAccount type
type GameAccount = {
    player: web3.PublicKey;
    bet_amount: BN;
    result: number;
};

// Extend the Program type with custom accounts
export type CasinoPlinkoProgram = Program & {
    account: {
        playerAccount: {
            fetch: (publicKey: web3.PublicKey) => Promise<PlayerAccount>;
        };
        gameAccount: {
            fetch: (publicKey: web3.PublicKey) => Promise<GameAccount>;
        };
    };
};

const programId = new web3.PublicKey(IDL.address);

export const useAnchorProgram = (): CasinoPlinkoProgram | null => {
    const { publicKey, signTransaction, signAllTransactions } = useWallet();

    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');

    const provider = useMemo(() => {
        if (!publicKey || !signTransaction || !signAllTransactions) return null;
        return new AnchorProvider(connection, {
            publicKey,
            signTransaction,
            signAllTransactions,
        }, {
            commitment: 'confirmed',
        });
    }, [publicKey, signTransaction, signAllTransactions, connection]);

    return useMemo(() => {
        if (!provider) return null;
        return new Program(IDL as Idl, provider) as CasinoPlinkoProgram;
    }, [provider]);
};