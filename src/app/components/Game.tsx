import Phaser from 'phaser';
import React from 'react';

class PlinkoGame extends Phaser.Scene {
    private ball!: Phaser.Physics.Matter.Image;

    constructor() {
        super({ key: 'PlinkoGame' });
    }

    preload() {
        // No need to load external images
    }

    create() {
        // Create pegs using rectangles
        const pegs: Phaser.GameObjects.Rectangle[] = [];
        const rows = 8;
        const cols = 8;
        const spacing = 50;
        const offsetX = 100;
        const offsetY = 100;
        const pegSize = 10; // Size of each peg

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = offsetX + col * spacing;
                const y = offsetY + row * spacing;
                const peg = this.add.rectangle(x, y, pegSize, pegSize, 0x0000ff); // Blue pegs
                this.matter.add.gameObject(peg, { isStatic: true }); // Make pegs static
                pegs.push(peg);
            }
        }

        // Create ball using a circle
        const ballRadius = 15;
        const ballGraphics = this.add.graphics();
        ballGraphics.fillStyle(0xff0000, 1); // Red color
        ballGraphics.fillCircle(0, 0, ballRadius); // Draw a circle at (0, 0)

        // Create a Matter.js body for the ball
        const ballBody = this.matter.add.circle(400, 50, ballRadius, {
            restitution: 0.8,
            friction: 0.005,
        });

        // Create a container to link the graphics and physics body
        this.ball = this.matter.add.gameObject(ballGraphics, { shape: 'circle', radius: ballRadius }) as Phaser.Physics.Matter.Image;
        this.ball.setExistingBody(ballBody); // Use the existing Matter.js body
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