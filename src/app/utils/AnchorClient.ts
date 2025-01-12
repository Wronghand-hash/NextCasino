import { Program, Provider, web3, Idl, AnchorProvider, BN } from '@coral-xyz/anchor';
import IDL from "../idl/casino_plinko.json"; // Adjust the path to your IDL
import { useWallet } from '@solana/wallet-adapter-react';

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
type CasinoPlinkoProgram = Program & {
    account: {
        playerAccount: {
            fetch: (publicKey: web3.PublicKey) => Promise<PlayerAccount>;
        };
        gameAccount: {
            fetch: (publicKey: web3.PublicKey) => Promise<GameAccount>;
        };
    };
};

const programId = new web3.PublicKey("Byn4gnsR2JgmeyrSXYg4e4iCms2ou56pMV35bEhSWFZk");

export const useAnchorProgram = (): CasinoPlinkoProgram => {
    const wallet = useWallet();
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
    const provider = new AnchorProvider(connection, wallet as any, {});

    return new Program(IDL as Idl, provider) as CasinoPlinkoProgram;
};