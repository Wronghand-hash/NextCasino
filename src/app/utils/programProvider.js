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
  const connection = useMemo(() => new Connection(network), [network]);

  const provider = useMemo(() => {
    if (!isClient || !wallet || !connected) {
      console.error('Wallet is not connected or component is not mounted');
      return null;
    }

    try {
      const adaptedWallet = adaptWallet(wallet);
      return new AnchorProvider(connection, adaptedWallet, {
        preflightCommitment: 'processed',
      });
    } catch (error) {
      console.error('Error creating provider:', error);
      return null;
    }
  }, [isClient, connection, wallet, connected]);

  const program = useMemo(() => {
    if (!provider || !idl.address) {
      console.error('Provider or program ID is undefined');
      return null;
    }
    return new Program(idl, new PublicKey(idl.address), provider);
  }, [provider]);

  useEffect(() => {
    console.log('ProgramProvider mounted, wallet:', wallet, 'connected:', connected);
    setIsClient(true); // Set isClient to true after mounting
  }, [wallet, connected]);

  return (
    <ProgramContext.Provider value={{ program }}>
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgram = () => useContext(ProgramContext);