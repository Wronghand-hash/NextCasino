# Casino Plinko - Frontend (Next.js)

This repository contains the **frontend** for the decentralized **Plinko** game, which interacts with the **Solana** blockchain using a **Solana smart contract** written in the **Anchor framework**. The frontend is built with **Next.js** and allows users to interact with the Plinko game deployed on Solana, enabling features like placing bets, viewing game results, and checking balances.

## Features
- **Connect Wallet**: Users can connect their Solana wallet (e.g., Phantom, Sollet, or Solflare) to interact with the game.
- **Place Bets**: Players can place bets by sending SOL to the game contract.
- **View Game Results**: Players can view whether they won or lost and the payout.
- **Check Balance**: Players can check their balance in the game.
- **Admin Top-Up**: Admins can top up the game account with additional SOL if needed.

## Table of Contents
- [Installation](#installation)
- [Frontend Setup](#frontend-setup)
- [Usage](#usage)
- [Solana Smart Contract Interaction](#solana-smart-contract-interaction)
- [License](#license)

## Installation

### 1. Clone the repository

Clone the project to your local machine:
```bash
git clone https://github.com/yourusername/casino-plinko-frontend.git
cd casino-plinko-frontend
```

### 2. Install dependencies

Install all required dependencies using npm:
```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of your project and add the following environment variables:

```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet # or mainnet-beta
NEXT_PUBLIC_PROGRAM_ID=your_program_id_here
```

- Replace `your_program_id_here` with the program ID of the Solana smart contract you deployed.
- The `NEXT_PUBLIC_SOLANA_NETWORK` variable is used to specify whether you're interacting with the Solana `devnet` or `mainnet-beta`.

---

## Frontend Setup

This frontend is built using **Next.js** and uses the **Solana Web3.js** library to interact with the deployed Solana program (smart contract). It also uses **React** for building the UI components and manages state using React hooks.

### Dependencies
- **@solana/web3.js**: The Solana Web3.js library is used to interact with the Solana blockchain.
- **@project-serum/anchor**: This library simplifies interaction with Solana programs that are written using the **Anchor** framework.
- **@solana/wallet-adapter-react**: A React library for connecting with Solana wallets like Phantom, Sollet, or Solflare.
- **Next.js**: A React framework for building server-side rendered and statically generated web applications.

### 4. Start the development server

Once you’ve set up your environment variables and installed dependencies, you can start the development server:

```bash
npm run dev
```

This will start the app locally at [http://localhost:3000](http://localhost:3000).

---

## Usage

### Connect Wallet

Users can connect their wallet using the **Solana wallet adapter**. The frontend supports popular Solana wallets such as **Phantom**, **Sollet**, and **Solflare**. Once connected, the user's public key will be displayed on the interface.

### Place a Bet

After connecting the wallet, players can place a bet by entering an amount in SOL and clicking the "Place Bet" button. This will trigger a transaction that sends SOL from the player's wallet to the game contract on Solana.

- The bet amount is transferred to the game contract.
- The game contract will process the bet and determine the result (Win or Loss).

### View Game Results

Once the bet is placed, the player can view the result of the game (Win or Loss) along with the payout based on the multiplier. If the player wins, the winnings (in SOL) are sent back to the player's wallet.

### Check Balance

Players can check their game account balance. The frontend will display the current balance of the game account, which is stored on the Solana blockchain.

### Admin Top-Up

Admins can top up the game account by sending SOL to the smart contract. The frontend provides an interface for admins to add funds to the contract to ensure the game has enough funds for player payouts.

---

## Solana Smart Contract Interaction

### 1. Program ID

The frontend interacts with the Solana program using the **program ID** of the smart contract. This ID is provided in the `.env.local` file.

### 2. Solana Web3.js and Anchor Integration

The frontend uses the `@solana/web3.js` library to create and send transactions on the Solana blockchain. The **Anchor framework** is also used to simplify interactions with the smart contract.

#### Key Smart Contract Functions

- **initialize_game**: The `initialize_game` function is called to set up the game account and fund it with an initial amount of SOL. The frontend allows the admin to call this function.
- **initialize_player**: Players must initialize their player accounts to participate in the game. The frontend allows players to call this function when they sign in with their wallet.
- **place_bet**: This function places a bet on the game by transferring SOL from the player's wallet to the game contract. The frontend facilitates this interaction.
- **determine_result**: The game result (Win or Loss) is determined by the contract, and the frontend displays this result.
- **check_balance**: This function allows the frontend to query the current balance of the game account.
- **top_up_game_account**: Admins can top up the game account with additional SOL using this function.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contributing

We welcome contributions to this project! If you have ideas, improvements, or bug fixes, feel free to open an issue or create a pull request. Make sure to follow the standard GitHub workflow (fork, clone, branch, commit, and pull request).

---

Let me know if you need any further changes or explanations!
