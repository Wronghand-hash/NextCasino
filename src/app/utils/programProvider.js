"use client"; // Mark this file as a Client Component

import { createContext, useContext, useMemo } from 'react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
const idl = require('./casino_plinko.json'); // Ensure the path is correct

const ProgramContext = createContext();

export const ProgramProvider = ({ children }) => {
    const { wallet } = useWallet();
    const network = clusterApiUrl('devnet'); // Use devnet for testing
    const connection = useMemo(() => new Connection(network), [network]);

    // Log wallet and connection for debugging
    console.log('Wallet:', wallet);
    console.log('Connection:', connection);

    const provider = useMemo(() => {
        if (!wallet || !connection) {
            console.error('Wallet or connection is undefined');
            return null;
        }
        return new AnchorProvider(connection, wallet, {
            preflightCommitment: 'processed',
        });
    }, [connection, wallet]);

    // Log provider for debugging
    console.log('Provider:', provider);

    const program = useMemo(() => {
        if (!provider || !idl.metadata.address) {
            console.error('Provider or program ID is undefined');
            return null;
        }
        return new Program(idl, idl.metadata.address, provider);
    }, [provider]);

    // Log program for debugging
    console.log('Program:', program);

    return (
        <ProgramContext.Provider value={{ program }}>
            {children}
        </ProgramContext.Provider>
    );
};

export const useProgram = () => useContext(ProgramContext);