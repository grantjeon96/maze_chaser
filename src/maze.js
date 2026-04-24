class Maze {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;
        this.grid = [];
        this.stack = [];
        this.items = [];
        this.startCell = { r: 0, c: 0 };
        this.exitCell = { r: rows - 1, c: cols - 1 };
        this.initGrid();
    }

    initGrid() {
        for (let r = 0; r < this.rows; r++) {
            let row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    r, c,
                    walls: [true, true, true, true], // Top, Right, Bottom, Left
                    visited: false
                });
            }
            this.grid.push(row);
        }
    }

    generate() {
        let current = this.grid[0][0];
        current.visited = true;
        this.stack.push(current);

        while (this.stack.length > 0) {
            let next = this.getUnvisitedNeighbor(current);
            if (next) {
                next.visited = true;
                this.stack.push(current);
                this.removeWalls(current, next);
                current = next;
            } else {
                current = this.stack.pop();
            }
        }
        
        // Randomize Start and Exit (ensure they are in different quadrants)
        const quadSize = Math.floor(this.cols / 2);
        this.startCell = { r: Math.floor(Math.random() * quadSize), c: Math.floor(Math.random() * quadSize) };
        this.exitCell = { 
            r: quadSize + Math.floor(Math.random() * quadSize), 
            c: quadSize + Math.floor(Math.random() * quadSize) 
        };
        
        this.spawnItems();
    }

    spawnItems() {
        this.items = [];
        const itemCount = Math.floor(this.cols * this.rows * 0.1); // 10% of cells have energy
        for (let i = 0; i < itemCount; i++) {
            this.items.push({
                r: Math.floor(Math.random() * this.rows),
                c: Math.floor(Math.random() * this.cols),
                type: 'energy'
            });
        }
    }

    getUnvisitedNeighbor(cell) {
        let neighbors = [];
        let { r, c } = cell;

        if (r > 0 && !this.grid[r - 1][c].visited) neighbors.push(this.grid[r - 1][c]);
        if (c < this.cols - 1 && !this.grid[r][c + 1].visited) neighbors.push(this.grid[r][c + 1]);
        if (r < this.rows - 1 && !this.grid[r + 1][c].visited) neighbors.push(this.grid[r + 1][c]);
        if (c > 0 && !this.grid[r][c - 1].visited) neighbors.push(this.grid[r][c - 1]);

        if (neighbors.length > 0) {
            return neighbors[Math.floor(Math.random() * neighbors.length)];
        }
        return null;
    }

    removeWalls(a, b) {
        let x = a.c - b.c;
        if (x === 1) {
            a.walls[3] = false;
            b.walls[1] = false;
        } else if (x === -1) {
            a.walls[1] = false;
            b.walls[3] = false;
        }

        let y = a.r - b.r;
        if (y === 1) {
            a.walls[0] = false;
            b.walls[2] = false;
        } else if (y === -1) {
            a.walls[2] = false;
            b.walls[0] = false;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = "rgba(0, 242, 255, 0.3)";
        ctx.lineWidth = 2;
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let cell = this.grid[r][c];
                let x = c * this.cellSize;
                let y = r * this.cellSize;

                if (cell.walls[0]) this.drawLine(ctx, x, y, x + this.cellSize, y);
                if (cell.walls[1]) this.drawLine(ctx, x + this.cellSize, y, x + this.cellSize, y + this.cellSize);
                if (cell.walls[2]) this.drawLine(ctx, x + this.cellSize, y + this.cellSize, x, y + this.cellSize);
                if (cell.walls[3]) this.drawLine(ctx, x, y + this.cellSize, x, y);
            }
        }

        // Draw Items
        ctx.shadowBlur = 15;
        this.items.forEach(item => {
            ctx.fillStyle = "#ff00ea";
            ctx.shadowColor = "#ff00ea";
            ctx.beginPath();
            ctx.arc((item.c + 0.5) * this.cellSize, (item.r + 0.5) * this.cellSize, 10, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Exit Portal
        const exitX = (this.cols - 0.5) * this.cellSize;
        const exitY = (this.rows - 0.5) * this.cellSize;
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#34c759";
        ctx.fillStyle = "#34c759";
        ctx.beginPath();
        ctx.arc(exitX, exitY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("EXIT", exitX, exitY + 8);

        ctx.shadowBlur = 0;
    }

    drawLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    isWall(x, y) {
        let c = Math.floor(x / this.cellSize);
        let r = Math.floor(y / this.cellSize);
        
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true;
        
        // Detailed collision check against walls of the current cell
        let cell = this.grid[r][c];
        let relX = x % this.cellSize;
        let relY = y % this.cellSize;
        let buffer = 10; // Collision buffer

        if (cell.walls[0] && relY < buffer) return true;
        if (cell.walls[1] && relX > this.cellSize - buffer) return true;
        if (cell.walls[2] && relY > this.cellSize - buffer) return true;
        if (cell.walls[3] && relX < buffer) return true;

        return false;
    }
}
