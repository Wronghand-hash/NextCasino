"use client"; // Add this if you're using hooks or browser APIs

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PlayerAccount } from './components/PlayerAccount';
import { PlaceBet } from './components/PlaceBet';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { connected } = useWallet();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Welcome to the Casino</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <WalletMultiButton />
      </div>
      {connected ? (
        <>
          <PlayerAccount />
          <PlaceBet />
        </>
      ) : (
        <p style={{ textAlign: 'center', color: '#888' }}>Please connect your wallet to start playing.</p>
      )}
    </div>
  );
}