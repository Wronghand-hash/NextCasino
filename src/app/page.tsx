import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { anchor } from '@project-serum/anchor'; // Import anchor for BN
import { useProgram, ProgramProvider } from './utils/programProvider'
import { WalletProviderWrapper } from './utils/WalletProvider';

const Home = () => {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [result, setResult] = useState(null);

  const initializePlayer = async () => {
    if (!publicKey) return;

    try {
      const tx = await program.methods
        .initializePlayer(new anchor.BN(1000)) // Initial balance
        .accounts({
          playerAccount: publicKey,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Player account initialized successfully!');
    } catch (error) {
      console.error('Error initializing player:', error);
    }
  };

  const placeBet = async () => {
    if (!publicKey || betAmount <= 0) return;

    try {
      const tx = await program.methods
        .placeBet(new anchor.BN(betAmount))
        .accounts({
          playerAccount: publicKey,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Bet placed successfully!');
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const determineResult = async () => {
    if (!publicKey) return;

    try {
      const tx = await program.methods
        .determineResult(1) // Example result (1 for win, 0 for lose)
        .accounts({
          playerAccount: publicKey,
          player: publicKey,
        })
        .rpc();

      console.log('Transaction signature:', tx);
      alert('Game result determined successfully!');
    } catch (error) {
      console.error('Error determining result:', error);
    }
  };

  return (
    <div>
      <h1>Plinko Casino</h1>
      <p>Your Balance: {balance}</p>

      <button onClick={initializePlayer}>Initialize Player</button>

      <div>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          placeholder="Bet Amount"
        />
        <button onClick={placeBet}>Place Bet</button>
      </div>

      <button onClick={determineResult}>Determine Result</button>

      {result && <p>Result: {result}</p>}
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