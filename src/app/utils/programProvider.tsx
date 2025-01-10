import { useMemo, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import idl from "./casino_plinko.json"; // Ensure the path is correct

const preflightCommitment = "processed";
const commitment = "confirmed";
const programID = new PublicKey(idl.address); // Use the address from the IDL

export const useAnchor = () => {
  const { wallet, connected } = useWallet();
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program<Idl> | null>(null);

  // Establish a connection to the Solana devnet
  const connection = useMemo(() => new Connection(clusterApiUrl("devnet"), commitment), []);

  // Create a provider when the wallet is connected
  useEffect(() => {
    if (wallet && connected && wallet.adapter) {
      const newProvider = new AnchorProvider(connection, wallet.adapter, {
        preflightCommitment,
        commitment,
      });
      setProvider(newProvider);
    } else {
      setProvider(null);
    }
  }, [wallet, connected, connection]);

  // Create a program when the provider is available
  useEffect(() => {
    if (!provider) {
      setProgram(null);
      return;
    }

    try {
      const newProgram = new Program(idl as Idl, programID, provider);
      setProgram(newProgram);
    } catch (error) {
      console.error("Error initializing program:", error);
      setProgram(null);
    }
  }, [provider]);

  return {
    wallet,
    connection,
    provider,
    program,
    programID,
  };
};