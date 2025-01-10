"use client";

import { createContext, useContext, useMemo, useEffect, useState, ReactNode } from "react";
import { Program, AnchorProvider, Idl } from "@project-serum/anchor";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl, PublicKey, Commitment, Transaction, VersionedTransaction, Keypair } from "@solana/web3.js";
import idl from "./casino_plinko.json"; // Ensure the path is correct

// Define the shape of the context value
interface ProgramContextState {
  program: Program<Idl> | null;
}

// Create the context with a default value
const ProgramContext = createContext<ProgramContextState>({ program: null });

// Custom hook to set up the program
const useProgramSetup = () => {
  const walletContextState = useWallet();
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program<Idl> | null>(null);

  const network = clusterApiUrl("devnet"); // Use devnet for testing
  const connection = useMemo(() => new Connection(network, "processed" as Commitment), [network]);

  useEffect(() => {
    if (walletContextState.wallet && walletContextState.connected) {
      try {
        const adaptedWallet = {
          publicKey: walletContextState.publicKey!,
          signTransaction: async (tx: Transaction) => {
            if (!walletContextState.signTransaction) {
              throw new Error("Wallet does not support signing transactions");
            }
            const signedTx = await walletContextState.signTransaction(tx);
            if (signedTx instanceof VersionedTransaction) {
              throw new Error("Versioned transactions are not supported by this provider");
            }
            return signedTx;
          },
          signAllTransactions: async (txs: Transaction[]) => {
            if (!walletContextState.signAllTransactions) {
              throw new Error("Wallet does not support signing multiple transactions");
            }
            const signedTxs = await walletContextState.signAllTransactions(txs);
            if (signedTxs.some((tx) => tx instanceof VersionedTransaction)) {
              throw new Error("Versioned transactions are not supported by this provider");
            }
            return signedTxs as Transaction[];
          },
          payer: Keypair.generate(), // Placeholder payer (replace with actual wallet keypair if available)
        };

        const newProvider = new AnchorProvider(connection, adaptedWallet, {
          preflightCommitment: "processed",
        });
        setProvider(newProvider);
      } catch (error) {
        console.error("Error creating provider:", error);
        setProvider(null);
      }
    } else {
      setProvider(null);
    }
  }, [walletContextState.wallet, walletContextState.connected, connection]);

  useEffect(() => {
    if (!provider) {
      console.warn("Provider is not set yet");
      setProgram(null);
      return;
    }

    // Ensure the IDL is correctly loaded and has the required properties
    if (!idl || !idl.metadata || !idl.address) {
      console.error("IDL is missing required properties:", idl);
      setProgram(null);
      return;
    }

    try {
      const programId = new PublicKey(idl.address);
      const newProgram = new Program(idl as unknown as Idl, programId, provider);
      setProgram(newProgram);
    } catch (error) {
      console.error("Error initializing program:", error instanceof Error ? error.message : "Unknown error");
      setProgram(null);
    }
  }, [provider]);

  return program;
};

// ProgramProvider component
interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider = ({ children }: ProgramProviderProps) => {
  const program = useProgramSetup();

  // Create the context value
  const contextValue = useMemo(() => ({ program }), [program]);

  return (
    <ProgramContext.Provider value={contextValue}>
      {children}
    </ProgramContext.Provider>
  );
};

// Custom hook to consume the context
export const useProgram = () => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error("useProgram must be used within a ProgramProvider");
  }
  return context;
};