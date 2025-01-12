"use client"; // Add this if you're using hooks or browser APIs

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PlayerAccount } from './components/PlayerAccount';
import { PlaceBet } from './components/PlaceBet';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Casino</h1>
      <WalletMultiButton />
      <PlayerAccount />
      <PlaceBet />
    </div>
  );
}