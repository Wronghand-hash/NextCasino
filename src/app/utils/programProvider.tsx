// utils/programProvider.ts
import { createContext, useContext, ReactNode } from "react";
import { Program, AnchorProvider, Wallet } from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import idl from "./casino_plinko.json"; // Adjust the path to your IDL file

// Replace with your program's public key
const PROGRAM_ID = new PublicKey("Byn4gnsR2JgmeyrSXYg4e4iCms2ou56pMV35bEhSWFZk");

// Define the context
const ProgramContext = createContext<Program | null>(null);

export const ProgramProvider = ({ children }: { children: ReactNode }) => {
  const { wallet, publicKey } = useWallet(); // Get wallet from wallet adapter
  const network = clusterApiUrl("devnet"); // Use devnet for testing
  const connection = new Connection(network, "confirmed");

  const provider = new AnchorProvider(
    connection,
    wallet as unknown as Wallet,
    AnchorProvider.defaultOptions()
  );

  const program = new Program(idl as any, PROGRAM_ID, provider);

  return (
    <ProgramContext.Provider value={program}>{children}</ProgramContext.Provider>
  );
};

// Custom hook to access the program
export const useProgram = () => {
  const program = useContext(ProgramContext);
  if (!program) {
    throw new Error("useProgram must be used within a ProgramProvider");
  }
  return { program };
};
