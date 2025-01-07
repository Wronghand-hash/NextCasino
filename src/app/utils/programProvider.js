import { createContext, useContext, useMemo } from 'react';
import { Program, Provider } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import idl from '../../../../casino-plinko/target/idl/casino_plinko.json'; // Replace with your IDL file

const ProgramContext = createContext();

export const ProgramProvider = ({ children }) => {
    const { wallet } = useWallet();
    const network = clusterApiUrl('devnet'); // Use devnet for testing
    const connection = useMemo(() => new Connection(network), [network]);

    const provider = useMemo(
        () =>
            new Provider(connection, wallet, {
                preflightCommitment: 'processed',
            }),
        [connection, wallet]
    );

    const program = useMemo(
        () => new Program(idl, idl.metadata.address, provider),
        [provider]
    );

    return (
        <ProgramContext.Provider value={{ program }}>
            {children}
        </ProgramContext.Provider>
    );
};

export const useProgram = () => useContext(ProgramContext);