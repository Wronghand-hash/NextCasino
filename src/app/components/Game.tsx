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
        // No need to load external images or fonts
    }

    create() {
        // Set a retro background color
        this.cameras.main.setBackgroundColor(0x000033); // Dark blue background

        // Create pegs in a pyramid pattern
        const pegs: Phaser.GameObjects.Arc[] = [];
        const rows = 8;
        const spacing = 50;
        const offsetX = this.scale.width / 2; // Center of the screen horizontally
        const offsetY = 100;

        for (let row = 0; row < rows; row++) {
            const cols = row + 1; // Number of pegs increases with each row
            for (let col = 0; col < cols; col++) {
                const x = offsetX + (col - (cols - 1) / 2) * spacing; // Center pegs horizontally
                const y = offsetY + row * spacing;
                const peg = this.add.circle(x, y, 6, 0xffffff); // White pegs
                this.matter.add.gameObject(peg, { isStatic: true }); // Make pegs static
                pegs.push(peg);
            }
        }

        // Create reward zones at the bottom
        const rewardZones: Phaser.GameObjects.Rectangle[] = [];
        const zoneWidth = 80;
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
            restitution: 0.8,
            friction: 0.005,
        });

        // Link the visual representation to the physics body
        const ball = this.matter.add.gameObject(ballVisual, { shape: 'circle', radius: ballRadius }) as Phaser.Physics.Matter.Image;
        this.balls.push(ball);

        // Track the ball's state
        this.isBallDropped = true;

        // Reset the state when the ball stops moving
        const checkBallVelocity = () => {
            if (ball.body && ball.body.velocity.y === 0 && ball.body.velocity.x === 0) {
                this.isBallDropped = false;

                // Check which reward zone the ball landed in
                const ballX = ball.x;
                const ballY = ball.y;
                const zoneWidth = 80;
                const offsetX = this.scale.width / 2;
                const multipliers = [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9];

                for (let i = 0; i < multipliers.length; i++) {
                    const zoneX = offsetX + (i - (multipliers.length - 1) / 2) * zoneWidth;
                    if (ballX > zoneX - zoneWidth / 2 && ballX < zoneX + zoneWidth / 2) {
                        this.rewardText.setText(`Reward: ${multipliers[i]}x`);
                        break;
                    }
                }
            } else {
                setTimeout(checkBallVelocity, 100); // Check again after 100ms
            }
        };

        checkBallVelocity();
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