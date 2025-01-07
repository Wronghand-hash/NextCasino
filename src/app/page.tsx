"use client"; // Mark this file as a Client Component

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { BN } from '@project-serum/anchor';
import { useProgram, ProgramProvider } from './utils/programProvider';
import { WalletProviderWrapper } from './utils/WalletProvider';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';

const Home = () => {
  const { publicKey, connected, wallet, connecting } = useWallet();
  const { program } = useProgram();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState('');
  const [result, setResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isDeterminingResult, setIsDeterminingResult] = useState(false);

  // Debug wallet connection
  useEffect(() => {
    console.log('Wallet connection state:', { publicKey, connected, wallet });
  }, [publicKey, connected, wallet]);

  // Fetch player account data
  const fetchPlayerAccount = async (playerAccountPDA: PublicKey) => {
    if (!program) return;

    try {
      const account = await program.account.playerAccount.fetch(playerAccountPDA);
      setBalance(account.balance.toNumber());
      console.log('Player account data:', account);
    } catch (error) {
      console.error('Error fetching player account:', error);
    }
  };

  // Initialize player account
  const initializePlayer = async () => {
    if (!publicKey || isInitializing || !program) {
      alert('Wallet is not connected or program is not available.');
      return;
    }

    setIsInitializing(true);
    try {
      const [playerAccountPDA] = await PublicKey.findProgramAddress(
        [Buffer.from('player_account'), publicKey.toBuffer()],
        program.programId
      );

      console.log('Initializing PlayerAccount PDA:', playerAccountPDA.toBase58());

      const tx = await program.methods
        .initializePlayer(new BN(1000))
        .accounts({
          playerAccount: playerAccountPDA,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Player account initialized successfully!');

      await fetchPlayerAccount(playerAccountPDA);
    } catch (error) {
      console.error('Error initializing player:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Place a bet
  const placeBet = async () => {
    const amount = parseFloat(betAmount);
    if (!publicKey || amount <= 0 || isPlacingBet || !program) {
      alert('Please enter a valid bet amount.');
      return;
    }

    setIsPlacingBet(true);
    try {
      const [playerAccountPDA] = await PublicKey.findProgramAddress(
        [Buffer.from('player_account'), publicKey.toBuffer()],
        program.programId
      );

      console.log('Placing Bet PlayerAccount PDA:', playerAccountPDA.toBase58());

      const tx = await program.methods
        .placeBet(new BN(amount))
        .accounts({
          playerAccount: playerAccountPDA,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Bet placed successfully!');

      await fetchPlayerAccount(playerAccountPDA);
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Determine game result
  const determineResult = async () => {
    if (!publicKey || isDeterminingResult || !program) {
      alert('Wallet is not connected or program is not available.');
      return;
    }

    setIsDeterminingResult(true);
    try {
      const [playerAccountPDA] = await PublicKey.findProgramAddress(
        [Buffer.from('player_account'), publicKey.toBuffer()],
        program.programId
      );

      console.log('Determining Result PlayerAccount PDA:', playerAccountPDA.toBase58());

      const tx = await program.methods
        .determineResult(new BN(1))
        .accounts({
          playerAccount: playerAccountPDA,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Game result determined successfully!');

      await fetchPlayerAccount(playerAccountPDA);
    } catch (error) {
      console.error('Error determining result:', error);
    } finally {
      setIsDeterminingResult(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Plinko Casino</h1>

      <div className="mb-8">
        <div className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          <WalletMultiButton style={{ all: 'unset', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
        </div>
      </div>

      {connected ? (
        <div className="space-y-6">
          <p className="text-xl">Your Balance: {balance}</p>

          <button
            onClick={initializePlayer}
            disabled={isInitializing || !program}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
          >
            {isInitializing ? 'Initializing...' : 'Initialize Player'}
          </button>

          <div className="flex space-x-4">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet Amount"
              min="0"
              className="p-2 rounded text-gray-900"
            />
            <button
              onClick={placeBet}
              disabled={isPlacingBet || !program || betAmount === '' || parseFloat(betAmount) <= 0}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:bg-yellow-300"
            >
              {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
            </button>
          </div>

          <button
            onClick={determineResult}
            disabled={isDeterminingResult || !program}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-red-300"
          >
            {isDeterminingResult ? 'Determining Result...' : 'Determine Result'}
          </button>

          {result && <p className="text-xl">Result: {result}</p>}
        </div>
      ) : (
        <p className="text-xl">Please connect your wallet to play.</p>
      )}
    </div>
  );
};

export default function Page() {
  return (
    <WalletProviderWrapper>
      <ProgramProvider>
        <Home />
      </ProgramProvider>
    </WalletProviderWrapper>
  );
}