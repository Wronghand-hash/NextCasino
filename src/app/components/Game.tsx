"use client";

import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface GameProps {
    betAmount: number;
    isBetPlaced: boolean;
    setIsBetPlaced: (isPlaced: boolean) => void;
    fetchPlayerBalance: () => Promise<void>;
}

export const Game: React.FC<GameProps> = ({
    betAmount,
    isBetPlaced,
    setIsBetPlaced,
    fetchPlayerBalance,
}) => {
    const [isDropping, setIsDropping] = useState<boolean>(false);
    const [gameResult, setGameResult] = useState<string | null>(null);
    const [ballPosition, setBallPosition] = useState<number>(0);

    const dropBall = async () => {
        if (!isBetPlaced) {
            toast.error("Please place a bet before dropping the ball.");
            return;
        }

        setIsDropping(true);
        setGameResult(null);

        // Simulate the ball drop animation
        const interval = setInterval(() => {
            setBallPosition((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 10;
            });
        }, 100);

        // Simulate the game result after a delay
        setTimeout(() => {
            const result = Math.random() > 0.5 ? "Win" : "Lose";
            setGameResult(result);
            setIsDropping(false);
            setIsBetPlaced(false); // Reset bet state after the ball is dropped

            // Handle win/lose logic
            if (result === "Win") {
                toast.success(`You won! ${betAmount} tokens added to your balance.`);
            } else {
                toast.error(`You lost! ${betAmount} tokens deducted from your balance.`);
            }

            // Fetch updated player balance
            fetchPlayerBalance();
        }, 2000); // Simulate a 2-second delay for the ball drop
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Plinko Game</h2>
            <div style={styles.gameArea}>
                <div style={styles.plinkoBoard}>
                    {/* Render the ball */}
                    <div
                        style={{
                            ...styles.ball,
                            top: `${ballPosition}%`,
                        }}
                    ></div>
                </div>
                <button
                    onClick={dropBall}
                    disabled={isDropping || !isBetPlaced}
                    style={styles.button}
                >
                    {isDropping ? "Dropping Ball..." : "Drop Ball"}
                </button>
                {gameResult && <p style={styles.result}>Result: {gameResult}</p>}
            </div>
            <ToastContainer />
        </div>
    );
};

const styles = {
    container: {
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        marginBottom: "20px",
    },
    title: {
        fontSize: "24px",
        marginBottom: "16px",
        color: "#333",
        textAlign: "center" as const,
    },
    gameArea: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
    },
    plinkoBoard: {
        width: "300px",
        height: "400px",
        backgroundColor: "#333",
        position: "relative" as const,
        overflow: "hidden",
    },
    ball: {
        width: "20px",
        height: "20px",
        backgroundColor: "red",
        borderRadius: "50%",
        position: "absolute" as const,
        left: "50%",
        transform: "translateX(-50%)",
        transition: "top 0.1s linear",
    },
    button: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
        marginTop: "20px",
    },
    result: {
        fontSize: "18px",
        color: "#333",
        textAlign: "center" as const,
        marginTop: "20px",
    },
};