"use client"; // Mark this file as a Client Component

import { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
const idl = require('./casino_plinko.json'); // Ensure the path is correct

// Create the context
const ProgramContext = createContext();

// Adapt the wallet object from @solana/wallet-adapter-react to match the Wallet interface expected by @project-serum/anchor
const adaptWallet = (wallet) => {
  if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
    throw new Error('Wallet is not connected or adapter is missing');
  }

  return {
    publicKey: wallet.adapter.publicKey,
    signTransaction: async (transaction) => {
      if (!wallet.adapter.signTransaction) {
        throw new Error('Wallet does not support signTransaction');
      }
      return wallet.adapter.signTransaction(transaction);
    },
    signAllTransactions: async (transactions) => {
      if (!wallet.adapter.signAllTransactions) {
        throw new Error('Wallet does not support signAllTransactions');
      }
      return wallet.adapter.signAllTransactions(transactions);
    },
  };
};

export const ProgramProvider = ({ children }) => {
  const { wallet, connected } = useWallet();
  const [provider, setProvider] = useState(null);

  const network = clusterApiUrl('devnet'); // Use devnet for testing
  const connection = useMemo(() => new Connection(network), [network]);

  useEffect(() => {
    console.log('Wallet state:', { wallet, connected });

    if (wallet && connected) {
      try {
        console.log('Adapting wallet:', wallet);
        const adaptedWallet = adaptWallet(wallet);
        console.log('Creating provider with adapted wallet:', adaptedWallet);
        const newProvider = new AnchorProvider(connection, adaptedWallet, {
          preflightCommitment: 'processed',
        });
        setProvider(newProvider);
      } catch (error) {
        console.error('Error creating provider:', error);
      }
    } else {
      console.log('Wallet is not connected or adapter is missing');
      setProvider(null); // Reset provider if wallet is disconnected
    }
  }, [wallet, connected, connection]);

  const program = useMemo(() => {
    if (!provider) {
      console.error('Provider is undefined');
      return null;
    }

    // Check if idl.address is defined and is a valid string
    if (!idl || !idl.address || typeof idl.address !== 'string') {
      console.error('Program ID is undefined or invalid in IDL:', idl);
      return null;
    }

    try {
      const programId = new PublicKey(idl.address);
      console.log('Initializing program with ID:', programId.toBase58());
      return new Program(idl, programId, provider);
    } catch (error) {
      console.error('Error initializing program:', error);
      return null;
    }
  }, [provider]);

  return (
    <ProgramContext.Provider value={{ program }}>
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgram = () => useContext(ProgramContext);