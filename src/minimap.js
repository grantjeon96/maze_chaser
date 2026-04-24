class Minimap {
    constructor(canvas, maze) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.maze = maze;
        this.scale = 1;
    }

    draw(player, enemies) {
        const { ctx, canvas, maze } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cellW = canvas.width / maze.cols;
        const cellH = canvas.height / maze.rows;

        // Draw Maze Structure
        ctx.strokeStyle = "rgba(0, 242, 255, 0.2)";
        ctx.lineWidth = 1;
        for (let r = 0; r < maze.rows; r++) {
            for (let c = 0; c < maze.cols; c++) {
                let cell = maze.grid[r][c];
                let x = c * cellW;
                let y = r * cellH;

                if (cell.walls[0]) this.line(x, y, x + cellW, y);
                if (cell.walls[1]) this.line(x + cellW, y, x + cellW, y + cellH);
                if (cell.walls[2]) this.line(x + cellW, y + cellH, x, y + cellH);
                if (cell.walls[3]) this.line(x, y + cellH, x, y);
            }
        }

        // Draw Player
        ctx.fillStyle = "#00f2ff";
        ctx.beginPath();
        ctx.arc((player.x / (maze.cols * maze.cellSize)) * canvas.width, (player.y / (maze.rows * maze.cellSize)) * canvas.height, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Enemies
        ctx.fillStyle = "#ff2d55";
        enemies.forEach(enemy => {
            ctx.beginPath();
            ctx.arc((enemy.x / (maze.cols * maze.cellSize)) * canvas.width, (enemy.y / (maze.rows * maze.cellSize)) * canvas.height, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw Exit
        ctx.fillStyle = "#34c759";
        ctx.fillRect(canvas.width - 10, canvas.height - 10, 8, 8);
    }

    line(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
}
