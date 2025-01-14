import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../utils/AnchorClient';
import { BN, web3 } from '@coral-xyz/anchor';

interface GameProps {
    wallet: any; // Replace `any` with the correct type for your wallet
    program: any; // Replace `any` with the correct type for your Anchor program
    betAmount: number;
    fetchPlayerBalance: () => Promise<void>;
    isBetPlaced: boolean;
    setIsBetPlaced: React.Dispatch<React.SetStateAction<boolean>>;
}

class PlinkoGame extends Phaser.Scene {
    private balls: Phaser.Physics.Matter.Image[] = [];
    isBallDropped: boolean = false;
    private rewardText!: Phaser.GameObjects.Text;
    private isBetPlaced: boolean = false;

    constructor() {
        super({ key: 'PlinkoGame' });
    }

    preload() {
        // Load assets (if any)
        this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor(0x000033);

        // Create pegs, reward zones, and other game elements
        const pegs: Phaser.GameObjects.Arc[] = [];
        const rows = 10;
        const spacing = 40;
        const offsetX = this.scale.width / 2;
        const offsetY = 100;

        for (let row = 2; row < rows; row++) {
            const cols = row + 1;
            for (let col = 0; col < cols; col++) {
                const x = offsetX + (col - (cols - 1) / 2) * spacing;
                const y = offsetY + (row - 2) * spacing;
                const peg = this.add.circle(x, y, 6, 0xffffff);
                this.matter.add.gameObject(peg, { isStatic: true });
                pegs.push(peg);
            }
        }

        // Create reward zones
        const rewardZones: Phaser.GameObjects.Rectangle[] = [];
        const zoneWidth = 60;
        const zoneHeight = 20;
        const zoneY = this.scale.height - 50;

        const multipliers = [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9];
        const zoneColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0x8b00ff, 0x00ff00, 0xffff00, 0xff7f00, 0xff0000];

        for (let i = 0; i < multipliers.length; i++) {
            const x = offsetX + (i - (multipliers.length - 1) / 2) * zoneWidth;
            const zone = this.add.rectangle(x, zoneY, zoneWidth, zoneHeight, zoneColors[i], 0.7);
            this.matter.add.gameObject(zone, { isStatic: true, isSensor: true });
            rewardZones.push(zone);

            this.add.text(x, zoneY - 10, `${multipliers[i]}x`, {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial',
            }).setOrigin(0.5);
        }

        // Text to display the reward
        this.rewardText = this.add.text(this.scale.width / 2, 50, '', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);
    }

    dropBall() {
        if (this.isBallDropped) return;  // Prevent multiple balls from dropping

        const ballRadius = 10;
        const ballX = this.scale.width / 2;
        const ballY = 50;

        const ballVisual = this.add.circle(ballX, ballY, ballRadius, 0xff0000);
        const ballBody = this.matter.add.circle(ballX, ballY, ballRadius, {
            restitution: 0.5,
            friction: 0.001,
        });

        const ball = this.matter.add.gameObject(ballVisual, { shape: 'circle', radius: ballRadius }) as Phaser.Physics.Matter.Image;
        this.balls.push(ball);

        this.isBallDropped = true;

        const checkBallPosition = () => {
            if (ball.y >= this.scale.height - 50) {
                this.isBallDropped = false;

                const ballX = ball.x;
                const zoneWidth = 60;
                const offsetX = this.scale.width / 2;
                const multipliers = [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9];

                for (let i = 0; i < multipliers.length; i++) {
                    const zoneX = offsetX + (i - (multipliers.length - 1) / 2) * zoneWidth;
                    if (ballX > zoneX - zoneWidth / 2 && ballX < zoneX + zoneWidth / 2) {
                        this.rewardText.setText(`Reward: ${multipliers[i]}x`);
                        this.playWinningAnimation(ballX, ball.y);
                        break;
                    }
                }
            } else {
                setTimeout(checkBallPosition, 100);
            }
        };

        checkBallPosition();
    }

    playWinningAnimation(x: number, y: number) {
        // Create a particle emitter for a winning effect
        const emitter = this.add.particles(x, y, 'flares', {
            frame: ['red', 'green', 'blue', 'yellow', 'white'],
            speed: { min: -600, max: 600 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 1000,
            gravityY: 500,
            quantity: 20,
            rotate: { start: 0, end: 360 },
        });

        // Stop the emitter after a short duration
        this.time.delayedCall(1000, () => {
            emitter.stop();
        });
    }

    update() {
        // Game logic (e.g., check for collisions, update score)
    }
}

const Game: React.FC<GameProps> = ({ wallet, program, betAmount, fetchPlayerBalance, isBetPlaced, setIsBetPlaced }) => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 800,
                height: 600,
                physics: {
                    default: 'matter',
                    matter: {
                        gravity: { y: 0.5, x: 0 },
                        debug: false,
                    },
                },
                scene: [PlinkoGame],
            };
            gameRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (isBetPlaced) {
            // Once the bet is placed, immediately drop the ball
            const gameScene = gameRef.current?.scene.getScene('PlinkoGame') as PlinkoGame; // Explicitly cast to PlinkoGame
            if (gameScene && !gameScene.isBallDropped) {
                gameScene.dropBall();  // Trigger the ball drop
                setIsBetPlaced(false); // Reset the bet status
            }
        }
    }, [isBetPlaced]);

    return <div id="game-container" style={{ width: '100%', height: '100%' }} />;
};

export default Game;
