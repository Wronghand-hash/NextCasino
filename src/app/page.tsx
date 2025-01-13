"use client"; // Add this if you're using hooks or browser APIs

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PlayerAccount } from './components/PlayerAccount';
import { PlaceBet } from './components/PlaceBet';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { connected } = useWallet();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to the Casino</h1>
      <div style={styles.walletButtonContainer}>
        <WalletMultiButton style={styles.walletButton} />
      </div>
      {connected ? (
        <>
          <PlayerAccount />
          <PlaceBet />
        </>
      ) : (
        <p style={styles.connectMessage}>Please connect your wallet to start playing.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    textAlign: 'center' as const, // Explicitly set as a valid value
    marginBottom: '20px',
    fontSize: '32px',
    color: '#333',
  },
  walletButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  walletButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  connectMessage: {
    textAlign: 'center' as const, // Explicitly set as a valid value
    color: '#888',
    fontSize: '18px',
  },
};