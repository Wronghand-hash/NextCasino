// import React, { useMemo } from "react";
// import { useAnchorWallet } from "@solana/wallet-adapter-react";
// import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
// import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
// import idl from "./casino_plinko.json"; // Replace with your IDL file path

// const preflightCommitment = "processed";
// const commitment = "confirmed";
// const programID = new PublicKey(idl.address);

// export const useAnchor = () => {
//     const wallet = useAnchorWallet();

//     // Establish a connection to the Solana devnet
//     const connection = useMemo(() => new Connection(clusterApiUrl("devnet"), commitment), []);

//     // Create a provider
//     const provider = useMemo(() => {
//         if (!wallet) return null;
//         return new AnchorProvider(connection, wallet, {
//             preflightCommitment,
//             commitment,
//         });
//     }, [wallet, connection]);
//     const programId = new PublicKey(idl.address);
//     // Create a Program instance
//     const program = useMemo(() => {
//         if (!provider) return null;
//         return new Program(idl as Idl, programId, provider); // Corrected: provider is passed as the third argument
//     }, [provider, programID]);

//     return {
//         wallet,
//         connection,
//         provider,
//         program,
//         programID,
//     };
// };