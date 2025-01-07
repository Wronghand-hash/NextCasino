"use client"; // Mark this file as a Client Component

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; // Import WalletMultiButton
import { BN } from '@project-serum/anchor';
import { useProgram, ProgramProvider } from './utils/programProvider';
import { WalletProviderWrapper } from './utils/WalletProvider';
import { useState } from 'react';

const Home = () => {
  const { publicKey, connected } = useWallet(); // Add `connected` to check wallet connection
  const { program } = useProgram();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [result, setResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isDeterminingResult, setIsDeterminingResult] = useState(false);

  const initializePlayer = async () => {
    if (!publicKey || isInitializing) return;

    setIsInitializing(true);
    try {
      const tx = await program.methods
        .initializePlayer(new BN(1000)) // Initial balance
        .accounts({
          playerAccount: publicKey,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Player account initialized successfully!');
    } catch (error) {
      console.error('Error initializing player:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const placeBet = async () => {
    if (!publicKey || betAmount <= 0 || isPlacingBet) {
      alert('Please enter a valid bet amount.');
      return;
    }

    setIsPlacingBet(true);
    try {
      const tx = await program.methods
        .placeBet(new BN(betAmount))
        .accounts({
          playerAccount: publicKey,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Bet placed successfully!');
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const determineResult = async () => {
    if (!publicKey || isDeterminingResult) return;

    setIsDeterminingResult(true);
    try {
      const tx = await program.methods
        .determineResult(new BN(1)) // Example result (1 for win, 0 for lose)
        .accounts({
          playerAccount: publicKey,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Game result determined successfully!');
    } catch (error) {
      console.error('Error determining result:', error);
    } finally {
      setIsDeterminingResult(false);
    }
  };

  return (
    <div>
      <h1>Plinko Casino</h1>

      {/* Wallet Connect Button */}
      <div style={{ marginBottom: '20px' }}>
        <WalletMultiButton />
      </div>

      {connected ? ( // Only show the app content if the wallet is connected
        <>
          <p>Your Balance: {balance}</p>

          <button onClick={initializePlayer} disabled={isInitializing}>
            {isInitializing ? 'Initializing...' : 'Initialize Player'}
          </button>

          <div>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              placeholder="Bet Amount"
            />
            <button onClick={placeBet} disabled={isPlacingBet}>
              {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
            </button>
          </div>

          <button onClick={determineResult} disabled={isDeterminingResult}>
            {isDeterminingResult ? 'Determining Result...' : 'Determine Result'}
          </button>

          {result && <p>Result: {result}</p>}
        </>
      ) : (
        <p>Please connect your wallet to play.</p>
      )}
    </div>
  );
};

export default function Page() {
  return (
    <WalletProviderWrapper> {/* Wrap with WalletProviderWrapper */}
      <ProgramProvider> {/* Wrap with ProgramProvider */}
        <Home /> {/* Render the Home component */}
      </ProgramProvider>
    </WalletProviderWrapper>
  );
} 