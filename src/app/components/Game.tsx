import Phaser from 'phaser';
import React from 'react';

class PlinkoGame extends Phaser.Scene {
    private balls: Phaser.Physics.Matter.Image[] = []; // Array to store multiple balls
    private isBallDropped: boolean = false; // Track if a ball is currently in motion
    private rewardText!: Phaser.GameObjects.Text; // Text to display the reward

    constructor() {
        super({ key: 'PlinkoGame' });
    }

    preload() {
        // Load the flares texture for particle effects
        this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');
    }

    create() {
        // Set a retro background color
        this.cameras.main.setBackgroundColor(0x000033); // Dark blue background

        // Create pegs in a pyramid pattern, starting from the third row
        const pegs: Phaser.GameObjects.Arc[] = [];
        const rows = 10; // Total number of rows
        const spacing = 40; // Adjusted spacing
        const offsetX = this.scale.width / 2; // Center of the screen horizontally
        const offsetY = 100;

        for (let row = 2; row < rows; row++) { // Start from the third row
            const cols = row + 1; // Number of pegs increases with each row
            for (let col = 0; col < cols; col++) {
                const x = offsetX + (col - (cols - 1) / 2) * spacing; // Center pegs horizontally
                const y = offsetY + (row - 2) * spacing; // Adjust y position to account for removed rows
                const peg = this.add.circle(x, y, 6, 0xffffff); // White pegs
                this.matter.add.gameObject(peg, { isStatic: true }); // Make pegs static
                pegs.push(peg);
            }
        }

        // Create reward zones at the bottom
        const rewardZones: Phaser.GameObjects.Rectangle[] = [];
        const zoneWidth = 60; // Adjusted zone width
        const zoneHeight = 20;
        const zoneY = this.scale.height - 50; // Bottom of the screen

        // Add reward zones with multipliers
        const multipliers = [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9]; // Multipliers for each zone
        const zoneColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0x8b00ff, 0x00ff00, 0xffff00, 0xff7f00, 0xff0000]; // Retro rainbow colors
        for (let i = 0; i < multipliers.length; i++) {
            const x = offsetX + (i - (multipliers.length - 1) / 2) * zoneWidth;
            const zone = this.add.rectangle(x, zoneY, zoneWidth, zoneHeight, zoneColors[i], 0.7); // Retro-colored zones with transparency
            this.matter.add.gameObject(zone, { isStatic: true, isSensor: true }); // Make zones static and non-collidable
            rewardZones.push(zone);

            // Display multiplier text using default text rendering
            this.add.text(x, zoneY - 10, `${multipliers[i]}x`, {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial',
            }).setOrigin(0.5);
        }

        // Enable input for dropping balls
        this.input.on('pointerdown', () => {
            if (!this.isBallDropped) {
                this.dropBall();
            }
        });

        // Text to display the reward
        this.rewardText = this.add.text(this.scale.width / 2, 50, '', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);
    }

    dropBall() {
        // Create a new ball
        const ballRadius = 10;
        const ballX = this.scale.width / 2; // Center of the screen horizontally
        const ballY = 50; // Top of the screen

        // Create a visual representation of the ball using an Arc
        const ballVisual = this.add.circle(ballX, ballY, ballRadius, 0xff0000); // Red ball

        // Create a Matter.js body for the ball
        const ballBody = this.matter.add.circle(ballX, ballY, ballRadius, {
            restitution: 0.5, // Adjust restitution to prevent sticking
            friction: 0.001, // Reduce friction to prevent sticking
        });

        // Link the visual representation to the physics body
        const ball = this.matter.add.gameObject(ballVisual, { shape: 'circle', radius: ballRadius }) as Phaser.Physics.Matter.Image;
        this.balls.push(ball);

        // Track the ball's state
        this.isBallDropped = true;

        // Reset the state when the ball reaches the bottom
        const checkBallPosition = () => {
            if (ball.y >= this.scale.height - 50) { // Check if the ball reaches the bottom
                this.isBallDropped = false;

                // Check which reward zone the ball landed in
                const ballX = ball.x;
                const zoneWidth = 60;
                const offsetX = this.scale.width / 2;
                const multipliers = [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9];

                for (let i = 0; i < multipliers.length; i++) {
                    const zoneX = offsetX + (i - (multipliers.length - 1) / 2) * zoneWidth;
                    if (ballX > zoneX - zoneWidth / 2 && ballX < zoneX + zoneWidth / 2) {
                        this.rewardText.setText(`Reward: ${multipliers[i]}x`);
                        this.playWinningAnimation(ballX, ball.y); // Trigger celebratory animation
                        break;
                    }
                }
            } else {
                setTimeout(checkBallPosition, 100); // Check again after 100ms
            }
        };

        checkBallPosition();
    }

    playWinningAnimation(x: number, y: number) {
        // Create a particle emitter for a celebratory effect
        const emitter = this.add.particles(x, y, 'flares', {
            frame: ['red', 'green', 'blue', 'yellow', 'white'], // Use multiple colors
            speed: { min: -600, max: 600 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 }, // Particles start large and shrink
            blendMode: 'ADD',
            lifespan: 1000, // Longer lifespan for a more dramatic effect
            gravityY: 500,
            quantity: 20, // More particles for a festive look
            rotate: { start: 0, end: 360 }, // Rotate particles for extra flair
        });

        // Stop the emitter after a short duration
        this.time.delayedCall(1000, () => {
            emitter.stop(); // Stop the emitter after 1 second
        });
    }

    update() {
        // Game logic (e.g., check for collisions, update score)
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                y: 0.5,
                x: 0,
            },
            debug: false,
        },
    },
    scene: [PlinkoGame],
};

const Game: React.FC = () => {
    const gameRef = React.useRef<Phaser.Game | null>(null);

    React.useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return <div id="game-container" />;
};

export default Game;