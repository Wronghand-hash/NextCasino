"use client";

import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    CloverWalletAdapter,
    AlphaWalletAdapter,
    AvanaWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    // Use Devnet for testing (can be configured via environment variables)
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // Supported wallets
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new CloverWalletAdapter(),
            new AlphaWalletAdapter(),
            new AvanaWalletAdapter(),
        ],
        [network]
    );

    // Optional: Handle wallet errors
    const onError = (error: any) => {
        console.error('Wallet Error:', error);
    };

    return (
        <SolanaWalletProvider
            wallets={wallets}
            autoConnect // Automatically reconnect the wallet if previously connected
            onError={onError} // Handle wallet errors
        >
            <WalletModalProvider>
                {children}
            </WalletModalProvider>
        </SolanaWalletProvider>
    );
};