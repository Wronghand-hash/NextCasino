"use client"; // Mark this file as a Client Component

import { useMemo, useEffect, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

export const WalletProviderWrapper = ({ children }) => {
  const [isClient, setIsClient] = useState(false); // Track if the component is mounted

  useEffect(() => {
    console.log('WalletProviderWrapper mounted');
    setIsClient(true); // Set isClient to true after mounting
  }, []);

  // Use devnet for testing
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  console.log('Network:', network); // Log the network
  console.log('Endpoint:', endpoint); // Log the endpoint

  // Supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  if (!isClient) {
    return null; // Render nothing on the server
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};