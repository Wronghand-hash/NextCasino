// app/layout.tsx
import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletProvider } from './components/WalletProvider';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <WalletProvider>{children}</WalletProvider>
            </body>
        </html>
    );
}