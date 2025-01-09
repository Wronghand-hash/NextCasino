"use client"; // Mark this file as a Client Component

import { useMemo, useEffect, useState } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

export const WalletProviderWrapper = ({ children }) => {
  const [isClient, setIsClient] = useState(false); // Track if the component is mounted

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("WalletProviderWrapper mounted");
    }
    setIsClient(true); // Set isClient to true after mounting
  }, []);

  // Determine the network (default to Devnet for testing)
  const network =
    process.env.NEXT_PUBLIC_SOLANA_NETWORK || WalletAdapterNetwork.Devnet;

  // Define the endpoint
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network),
    [network]
  );

  // Log for debugging (development only)
  if (process.env.NODE_ENV === "development") {
    console.log("Network:", network);
    console.log("Endpoint:", endpoint);
  }

  // Supported wallets
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [network] // Add network as a dependency to reinitialize wallets if the network changes
  );

  if (!isClient) {
    return null; // Render nothing on the server
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}> {/* Disable autoConnect for debugging */}
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};