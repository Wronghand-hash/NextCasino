import Phaser from 'phaser';
import React from 'react';

class PlinkoGame extends Phaser.Scene {
    private balls: Phaser.Physics.Matter.Image[] = []; // Array to store multiple balls
    private isBallDropped: boolean = false; // Track if a ball is currently in motion
    private rewardText!: Phaser.GameObjects.BitmapText; // BitmapText to display the reward

    constructor() {
        super({ key: 'PlinkoGame' });
    }

    preload() {
        // Load a retro-style pixel font
        this.load.bitmapFont('retroFont', 'fonts/retroFont.png', 'fonts/retroFont.fnt');
    }

    create() {
        // Set a retro background color
        this.cameras.main.setBackgroundColor(0x1a1a1a);

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
                const peg = this.add.circle(x, y, 8, 0xff00ff); // Neon pink pegs
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
        const multipliers = [1.5, 2, 3, 5, 3, 2, 1.5]; // Multipliers for each zone
        const zoneColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0x8b00ff]; // Retro rainbow colors
        for (let i = 0; i < multipliers.length; i++) {
            const x = offsetX + (i - (multipliers.length - 1) / 2) * zoneWidth;
            const zone = this.add.rectangle(x, zoneY, zoneWidth, zoneHeight, zoneColors[i], 0.7); // Retro-colored zones with transparency
            this.matter.add.gameObject(zone, { isStatic: true, isSensor: true }); // Make zones static and non-collidable
            rewardZones.push(zone);

            // Display multiplier text in retro font
            this.add.bitmapText(x, zoneY - 10, 'retroFont', `${multipliers[i]}x`, 16).setOrigin(0.5);
        }

        // Enable input for dropping balls
        this.input.on('pointerdown', () => {
            if (!this.isBallDropped) {
                this.dropBall();
            }
        });

        // Text to display the reward
        this.rewardText = this.add.bitmapText(this.scale.width / 2, 50, 'retroFont', '', 24).setOrigin(0.5);
    }

    dropBall() {
        // Create a new ball
        const ballRadius = 15;
        const ballX = this.scale.width / 2; // Center of the screen horizontally
        const ballY = 50; // Top of the screen

        // Create a visual representation of the ball using an Arc
        const ballVisual = this.add.circle(ballX, ballY, ballRadius, 0x00ffff); // Cyan ball

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
                const multipliers = [1.5, 2, 3, 5, 3, 2, 1.5];

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