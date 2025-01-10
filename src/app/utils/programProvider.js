"use client";

import { createContext, useContext, useMemo, useEffect, useState } from "react";
import { Program, AnchorProvider } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import idl from "./casino_plinko.json"; // Ensure the path is correct

const ProgramContext = createContext();

const adaptWallet = (wallet) => {
  if (!wallet || !wallet.adapter || !wallet.adapter.publicKey) {
    throw new Error("Wallet is not connected or adapter is missing");
  }

  return {
    publicKey: wallet.adapter.publicKey,
    signTransaction: wallet.adapter.signTransaction?.bind(wallet.adapter),
    signAllTransactions: wallet.adapter.signAllTransactions?.bind(wallet.adapter),
  };
};

export const ProgramProvider = ({ children }) => {
  const { wallet, connected } = useWallet();
  const [provider, setProvider] = useState(null);

  const network = clusterApiUrl("devnet"); // Use devnet for testing
  const connection = useMemo(() => new Connection(network), [network]);

  useEffect(() => {
    if (wallet && connected) {
      try {
        const adaptedWallet = adaptWallet(wallet);
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
  }, [wallet, connected, connection]);

  const program = useMemo(() => {
    if (!provider || !idl || !idl.address) {
      console.error("Provider, IDL, or program address is missing");
      return null;
    }

    try {
      console.log(idl.address)
      const programId = new PublicKey(idl.address);

      // Validate IDL structure
      if (!idl.instructions || !Array.isArray(idl.instructions)) {
        throw new Error("IDL missing or invalid 'instructions' field");
      }
      if (!idl.accounts || !Array.isArray(idl.accounts)) {
        throw new Error("IDL missing or invalid 'accounts' field");
      }

      console.log('idl:', idl, "\n program id :", programId, "\n provider:", provider)

      return new Program(idl, programId, provider);
    } catch (error) {
      console.error("Error initializing program:", error.message);
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
