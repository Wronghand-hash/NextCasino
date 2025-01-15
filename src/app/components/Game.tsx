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
  const gravity = 0.05; // Reduced gravity for slower movement
  const friction = 0.98; // Reduced friction for more natural bouncing
  const rows = 6; // Total number of rows in the pyramid

  // Define the pegs, skipping the first 2 rows
  const pegs = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: row + 1 }, (_, col) => ({
      x: 50 + (col - row / 2) * 15,  // Adjust x spacing
      y: (row + 1) * 10,  // Adjust y-position to start lower
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
      // Collision detected, calculate the normal vector
      const normalX = dx / distance;
      const normalY = dy / distance;

      // Calculate the dot product of the velocity and the normal vector
      const dotProduct = ballVelocity.x * normalX + ballVelocity.y * normalY;

      // Reflect the ball's velocity using the normal vector
      setBallVelocity((prev) => ({
        x: prev.x - 2 * dotProduct * normalX * friction,
        y: prev.y - 2 * dotProduct * normalY * friction,
      }));

      // Ensure the ball doesn't get stuck in the peg
      setBallPosition((prev) => ({
        x: prev.x - normalX * (ballRadius + pegRadius - distance),
        y: prev.y - normalY * (ballRadius + pegRadius - distance),
      }));
    }
  };

  // Function to update ball position and handle collisions
  const updateBallPosition = () => {
    if (!plinkoBoardRef.current) return;

    // Apply gravity to the y-velocity
    setBallVelocity((prev) => ({ x: prev.x, y: prev.y + gravity }));

    // Update ball position based on velocity
    setBallPosition((prev) => {
      let newPosition = { x: prev.x + ballVelocity.x, y: prev.y + ballVelocity.y };

      // Check for collisions with each peg
      pegs.forEach((peg) => {
        checkCollision(peg.x, peg.y);
      });

      // Check for wall collisions (left and right boundaries)
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
    if (ballPosition.y >= 90) { // Allow a small margin at the bottom
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
    <div>
      <h2>Plinko Game</h2>
      <div style={{ position: "relative", width: "100%", height: "400px", overflow: "hidden" }} ref={plinkoBoardRef}>
        {/* Render the Plinko pyramid */}
        {pegs.map((peg, idx) => (
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
              zIndex: 1,
            }}
          />
        ))}
        {/* Render the ball */}
        <div
          style={{
            position: "absolute",
            top: `${ballPosition.y}%`,
            left: `${ballPosition.x}%`,
            width: `${ballRadius * 2}px`,
            height: `${ballRadius * 2}px`,
            backgroundColor: "red",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        />
      </div>
      <button onClick={dropBall} disabled={isDropping || !isBetPlaced}>
        {isDropping ? "Dropping Ball..." : "Drop Ball"}
      </button>
      {gameResult && <p>Result: {gameResult}</p>}
      <ToastContainer />
    </div>
  );
};
