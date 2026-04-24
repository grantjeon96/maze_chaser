class Enemy {
    constructor(x, y, cellSize, color = "#ff2d55") {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 1.2;
        this.state = "PATROL";
        this.color = color;
        this.width = 25;
        this.height = 15;
        this.targetCell = null;
        this.cellSize = cellSize;
        this.path = [];
        this.visionRange = 250;
    }

    update(player, maze) {
        const canSee = this.checkLineOfSight(player, maze);

        if (canSee) {
            this.state = "PURSUIT";
            this.pursue(player, maze);
        } else {
            if (this.state === "PURSUIT" && !this.targetCell) {
                this.state = "PATROL"; // Lost sight, go back to patrol
            }
            this.patrol(maze);
        }

        this.move(maze);
    }

    checkLineOfSight(player, maze) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist > this.visionRange) return false;

        // Simple raycasting to check if there's a wall between enemy and player
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            const checkX = this.x + (player.x - this.x) * (i / steps);
            const checkY = this.y + (player.y - this.y) * (i / steps);
            
            // Check if this point is inside a wall
            const cellC = Math.floor(checkX / maze.cellSize);
            const cellR = Math.floor(checkY / maze.cellSize);
            
            if (cellR < 0 || cellR >= maze.rows || cellC < 0 || cellC >= maze.cols) continue;

            // Check walls of the cell we are in
            const cell = maze.grid[cellR][cellC];
            const relX = checkX % maze.cellSize;
            const relY = checkY % maze.cellSize;
            const b = 5;

            if (cell.walls[0] && relY < b) return false;
            if (cell.walls[1] && relX > maze.cellSize - b) return false;
            if (cell.walls[2] && relY > maze.cellSize - b) return false;
            if (cell.walls[3] && relX < b) return false;
        }
        return true;
    }

    move(maze) {
        if (!this.targetCell) return;

        const targetX = (this.targetCell.c + 0.5) * maze.cellSize;
        const targetY = (this.targetCell.r + 0.5) * maze.cellSize;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 5) {
            this.targetCell = (this.path && this.path.length > 0) ? this.path.shift() : null;
            return;
        }

        const angleToTarget = Math.atan2(dy, dx);
        this.angle += (angleToTarget - this.angle) * 0.1;
        
        const moveX = Math.cos(this.angle) * this.speed;
        const moveY = Math.sin(this.angle) * this.speed;

        // Anti-stuck check
        const prevX = this.x;
        const prevY = this.y;

        if (!maze.isWall(this.x + moveX, this.y + moveY)) {
            this.x += moveX;
            this.y += moveY;
        } else {
            // Slide along walls if possible
            if (!maze.isWall(this.x + moveX, this.y)) this.x += moveX;
            else if (!maze.isWall(this.x, this.y + moveY)) this.y += moveY;
            else {
                // Completely stuck, repath
                this.targetCell = null;
                this.path = [];
            }
        }

        // If after moving we haven't actually changed position much, we're likely stuck
        if (Math.hypot(this.x - prevX, this.y - prevY) < 0.1) {
            this.stuckTimer = (this.stuckTimer || 0) + 1;
            if (this.stuckTimer > 30) { // Stuck for 30 frames
                this.targetCell = null;
                this.path = [];
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }
    }

    pursue(player, maze) {
        if (this.path.length === 0 || Math.random() < 0.1) {
            const start = { c: Math.floor(this.x / maze.cellSize), r: Math.floor(this.y / maze.cellSize) };
            const end = { c: Math.floor(player.x / maze.cellSize), r: Math.floor(player.y / maze.cellSize) };
            this.path = this.findPath(start, end, maze);
            if (this.path.length > 0) this.targetCell = this.path.shift();
        }
    }

    patrol(maze) {
        if (!this.targetCell) {
            const start = { c: Math.floor(this.x / maze.cellSize), r: Math.floor(this.y / maze.cellSize) };
            let randR, randC;
            do {
                randR = Math.floor(Math.random() * maze.rows);
                randC = Math.floor(Math.random() * maze.cols);
            } while (randR === start.r && randC === start.c);

            this.path = this.findPath(start, { r: randR, c: randC }, maze);
            if (this.path.length > 0) this.targetCell = this.path.shift();
        }
    }

    findPath(start, end, maze) {
        let queue = [[start]];
        let visited = new Set();
        visited.add(`${start.c},${start.r}`);

        while (queue.length > 0) {
            let path = queue.shift();
            let cell = path[path.length - 1];

            if (cell.c === end.c && cell.r === end.r) return path;

            let neighbors = this.getNeighbors(cell, maze);
            for (let neighbor of neighbors) {
                if (!visited.has(`${neighbor.c},${neighbor.r}`)) {
                    visited.add(`${neighbor.c},${neighbor.r}`);
                    queue.push([...path, neighbor]);
                }
            }
        }
        return [];
    }

    getNeighbors(cell, maze) {
        let neighbors = [];
        let { r, c } = cell;
        if (r < 0 || r >= maze.rows || c < 0 || c >= maze.cols) return neighbors;
        let gridCell = maze.grid[r][c];

        if (!gridCell.walls[0] && r > 0) neighbors.push({ r: r - 1, c: c });
        if (!gridCell.walls[1] && c < maze.cols - 1) neighbors.push({ r: r, c: c + 1 });
        if (!gridCell.walls[2] && r < maze.rows - 1) neighbors.push({ r: r + 1, c: c });
        if (!gridCell.walls[3] && c > 0) neighbors.push({ r: r, c: c - 1 });

        return neighbors;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Eyes
        ctx.fillStyle = "white";
        ctx.fillRect(this.width / 2 - 4, -this.height / 2 + 2, 4, 3);
        ctx.fillRect(this.width / 2 - 4, this.height / 2 - 5, 4, 3);
        ctx.restore();
    }
}
