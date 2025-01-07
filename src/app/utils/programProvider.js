"use client"; // Mark this file as a Client Component

import { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
const idl = require('./casino_plinko.json'); // Ensure the path is correct

const ProgramContext = createContext();

export const ProgramProvider = ({ children }) => {
  const { wallet, connected } = useWallet();
  const [isClient, setIsClient] = useState(false); // Track if the component is mounted

  const network = clusterApiUrl('devnet'); // Use devnet for testing
  const connection = useMemo(() => new Connection(network), [network]);

  const provider = useMemo(() => {
    if (!isClient || !wallet || !connection || !connected) {
      console.error('Wallet or connection is undefined or not connected', 'wallet', wallet, 'connection', connection, 'connected', connected);
      return null;
    }
    return new AnchorProvider(connection, wallet, {
      preflightCommitment: 'processed',
    });
  }, [isClient, connection, wallet, connected]);

  const program = useMemo(() => {
    if (!provider || !idl.address) {
      console.error('Provider or program ID is undefined', 'provider', provider, 'idl ', idl.address);
      return null;
    }
    return new Program(idl, idl.address, provider);
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