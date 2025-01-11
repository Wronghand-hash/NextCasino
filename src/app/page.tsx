'use client'; // Mark this as a Client Component

import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Commitment, Transaction, Keypair, VersionedTransaction, ConfirmOptions } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import idl from './utils/casino_plinko.json';
import { useState } from 'react';
import { BN } from '@coral-xyz/anchor';

const programID = new PublicKey(idl.address);
const network = 'https://api.devnet.solana.com';
const opts: ConfirmOptions = { commitment: 'processed' }; // Use ConfirmOptions from @solana/web3.js

export default function Home() {
  const wallet = useWallet();
  const connection = new Connection(network, opts.commitment); // Correct initialization
  const [balance, setBalance] = useState(0);

  // Adapt the wallet object to match the Wallet interface expected by AnchorProvider
  const adaptedWallet: Wallet = {
    publicKey: wallet.publicKey!, // Use non-null assertion to satisfy the Wallet interface
    signTransaction: async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing transactions');
      }
      return wallet.signTransaction(transaction) as Promise<T>;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
      if (!wallet.signAllTransactions) {
        throw new Error('Wallet does not support signing multiple transactions');
      }
      return wallet.signAllTransactions(transactions) as Promise<T[]>;
    },
    payer: Keypair.generate(), // Add a dummy payer (not recommended for production)
  };

  const getProvider = () => {
    return new AnchorProvider(connection, adaptedWallet, opts);
  };

  const initializePlayer = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet.');
      return;
    }

    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    const [playerAccountPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
      programID
    );

    try {
      await program.methods
        .initializePlayer(new BN(100))
        .accounts({
          playerAccount: playerAccountPDA,
          player: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      alert('Player account initialized!');
    } catch (error) {
      console.error('Error initializing player account:', error);
      alert('Failed to initialize player account.');
    }
  };

  const placeBet = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet.');
      return;
    }

    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    const [playerAccountPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
      programID
    );

    const [gameAccountPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('game_account'), wallet.publicKey.toBuffer()],
      programID
    );

    try {
      await program.methods
        .placeBet(new BN(10))
        .accounts({
          playerAccount: playerAccountPDA,
          gameAccount: gameAccountPDA,
          player: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      alert('Bet placed!');
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet.');
    }
  };

  const determineResult = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet.');
      return;
    }

    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    const [playerAccountPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('player_account'), wallet.publicKey.toBuffer()],
      programID
    );

    const [gameAccountPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('game_account'), wallet.publicKey.toBuffer()],
      programID
    );

    try {
      await program.methods
        .determineResult(1)
        .accounts({
          gameAccount: gameAccountPDA,
          playerAccount: playerAccountPDA,
          player: wallet.publicKey,
        })
        .rpc();
      alert('Result determined!');
    } catch (error) {
      console.error('Error determining result:', error);
      alert('Failed to determine result.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'var(--font-geist-sans)' }}>
      <h1>Casino Plinko</h1>
      <button
        onClick={initializePlayer}
        style={{ marginRight: '10px', padding: '10px 20px', fontSize: '16px' }}
      >
        Initialize Player
      </button>
      <button
        onClick={placeBet}
        style={{ marginRight: '10px', padding: '10px 20px', fontSize: '16px' }}
      >
        Place Bet
      </button>
      <button
        onClick={determineResult}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        Determine Result
      </button>
    </div>
  );
}