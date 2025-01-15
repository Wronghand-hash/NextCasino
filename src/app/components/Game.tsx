"use client";

import { useState, useEffect, useRef } from "react";
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
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number }>({ x: 50, y: 0 });
  const [ballVelocity, setBallVelocity] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const plinkoBoardRef = useRef<HTMLDivElement>(null);

  const pegRadius = 5; // Radius of each peg
  const ballRadius = 10; // Radius of the ball
  const gravity = 0.5; // Gravity effect
  const friction = 0.7; // Friction effect
  const rows = 6; // Total number of rows in the pyramid

  // Define the pegs, skipping the first 2 rows
  const pegs = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: row + 1 }, (_, col) => ({
      x: 50 + (col - row / 2) * 10,
      y: (row + 1) * 10, // Adjust y-position to start lower
    }))
  )
    .slice(2) // Skip the first 2 rows
    .flat();

  // Function to check collision between ball and pegs
  const checkCollision = (pegX: number, pegY: number) => {
    const dx = ballPosition.x - pegX;
    const dy = ballPosition.y - pegY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ballRadius + pegRadius) {
      // Collision detected, change the ball's trajectory
      const angle = Math.atan2(dy, dx);
      const speed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y);

      // Adjust ball velocity after collision
      setBallVelocity((prev) => ({
        x: prev.x + Math.cos(angle) * speed * friction,
        y: prev.y + Math.sin(angle) * speed * friction,
      }));
    }
  };

  // Function to render the Plinko pyramid
  const renderPlinkoPyramid = () => {
    return pegs.map((peg, idx) => (
      <div
        key={idx}
        style={{
          position: "absolute",
          top: `${peg.y}%`,
          left: `${peg.x}%`,
          width: `${pegRadius * 2}px`,
          height: `${pegRadius * 2}px`,
          backgroundColor: "#fff",
          borderRadius: "50%",
        }}
      />
    ));
  };

  // Function to update ball position and handle collisions
  const updateBallPosition = () => {
    if (!plinkoBoardRef.current) return;

    // Apply gravity
    setBallVelocity((prev) => ({ x: prev.x, y: prev.y + gravity }));

    // Update ball position
    setBallPosition((prev) => {
      let newPosition = { x: prev.x + ballVelocity.x, y: prev.y + ballVelocity.y };

      // Check for collisions with each peg when ball is moving downward
      if (newPosition.y < 100 - ballRadius) {
        pegs.forEach((peg) => {
          checkCollision(peg.x, peg.y);
        });
      }

      // Check for wall collisions
      if (newPosition.x < ballRadius) {
        newPosition.x = ballRadius;
        setBallVelocity((prev) => ({ x: Math.abs(prev.x) * friction, y: prev.y }));
      } else if (newPosition.x > 100 - ballRadius) {
        newPosition.x = 100 - ballRadius;
        setBallVelocity((prev) => ({ x: -Math.abs(prev.x) * friction, y: prev.y }));
      }

      return newPosition;
    });

    // Stop the ball when it reaches the bottom
    if (ballPosition.y >= 100 - ballRadius) {
      setIsDropping(false);
      setBallVelocity({ x: 0, y: 0 });

      // Determine game result based on the final position of the ball
      const result = determineResult(ballPosition.x);
      setGameResult(result);
      setIsBetPlaced(false); // Reset bet state after the ball is dropped

      // Handle win/lose logic
      if (result === "Win") {
        toast.success(`You won! ${betAmount} tokens added to your balance.`);
      } else {
        toast.error(`You lost! ${betAmount} tokens deducted from your balance.`);
      }

      // Fetch updated player balance
      fetchPlayerBalance();
    }
  };

  // Function to determine the result based on the final position of the ball
  const determineResult = (finalX: number) => {
    // Define the winning zones (e.g., 30% - 70% of the board width)
    const winZoneStart = 30;
    const winZoneEnd = 70;

    if (finalX >= winZoneStart && finalX <= winZoneEnd) {
      return "Win";
    } else {
      return "Lose";
    }
  };

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (isDropping) {
        updateBallPosition();
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isDropping) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDropping, ballPosition, ballVelocity]);

  const dropBall = () => {
    if (!isBetPlaced) {
      toast.error("Please place a bet before dropping the ball.");
      return;
    }

    setIsDropping(true);
    setGameResult(null);
    setBallPosition({ x: 50, y: 0 });
    setBallVelocity({ x: 0, y: 0 });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Plinko Game</h2>
      <div style={styles.gameArea}>
        <div ref={plinkoBoardRef} style={styles.plinkoBoard}>
          {/* Render the Plinko pyramid */}
          {renderPlinkoPyramid()}
          {/* Render the ball */}
          <div
            style={{
              ...styles.ball,
              top: `${ballPosition.y}%`,
              left: `${ballPosition.x}%`,
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
    transform: "translate(-50%, -50%)",
    transition: "top 0.1s linear, left 0.1s linear",
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