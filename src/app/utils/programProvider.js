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
  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet is not connected');
  }

  return {
    publicKey: wallet.publicKey,
    signTransaction: async (transaction) => {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signTransaction');
      }
      return wallet.signTransaction(transaction);
    },
    signAllTransactions: async (transactions) => {
      if (!wallet.signAllTransactions) {
        throw new Error('Wallet does not support signAllTransactions');
      }
      return wallet.signAllTransactions(transactions);
    },
  };
};

export const ProgramProvider = ({ children }) => {
  const { wallet, connected } = useWallet();
  const [isClient, setIsClient] = useState(false); // Track if the component is mounted

  const network = clusterApiUrl('devnet'); // Use devnet for testing
  const connection = useMemo(() => {
    console.log('Creating connection to network:', network);
    return new Connection(network);
  }, [network]);

  const [provider, setProvider] = useState(null); // Use state to manage provider

  useEffect(() => {
    console.log('ProgramProvider mounted, wallet:', wallet, 'connected:', connected);
    setIsClient(true); // Set isClient to true after mounting

    if (isClient && wallet && connected) {
      try {
        console.log('Adapting wallet:', wallet);
        const adaptedWallet = adaptWallet(wallet);
        console.log('Creating provider with adapted wallet:', adaptedWallet);
        const newProvider = new AnchorProvider(connection, adaptedWallet, {
          preflightCommitment: 'processed',
        });
        setProvider(newProvider); // Set provider after mounting
      } catch (error) {
        console.error('Error creating provider:', error);
      }
    }
  }, [isClient, connection, wallet, connected]);

  const program = useMemo(() => {
    if (!provider) {
      console.error('Provider is undefined');
      return null;
    }

    if (!idl.address) {
      console.error('Program ID is undefined in IDL');
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