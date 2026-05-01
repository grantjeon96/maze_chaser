class Enemy {
    constructor(x, y, cellSize, color = "#ff2d55") {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 1.3;
        this.state = "PATROL";
        this.color = color;
        this.width = 25;
        this.height = 15;
        this.cellSize = cellSize;
        this.path = [];
        this.targetCell = null;
        this.visionRange = 250;
    }

    update(player, maze) {
        const canSee = this.checkLOS(player, maze);
        if (canSee) {
            this.state = "PURSUIT";
            this.pursue(player, maze);
        } else {
            if (this.state === "PURSUIT" && !this.targetCell) {
                this.state = "PATROL";
            }
            this.patrol(maze);
        }
        this.move();
    }

    checkLOS(player, maze) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist > this.visionRange) return false;
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            const cx = this.x + (player.x - this.x) * (i / steps);
            const cy = this.y + (player.y - this.y) * (i / steps);
            const cr = Math.floor(cy / this.cellSize), cc = Math.floor(cx / this.cellSize);
            if (cr < 0 || cr >= maze.rows || cc < 0 || cc >= maze.cols) continue;
            const cell = maze.grid[cr][cc], rx = cx % this.cellSize, ry = cy % this.cellSize, b = 5;
            if (cell.walls[0] && ry < b) return false;
            if (cell.walls[1] && rx > this.cellSize - b) return false;
            if (cell.walls[2] && ry > this.cellSize - b) return false;
            if (cell.walls[3] && rx < b) return false;
        }
        return true;
    }

    move() {
        if (!this.targetCell) return;

        // Target center point
        const tx = (this.targetCell.c + 0.5) * this.cellSize;
        const ty = (this.targetCell.r + 0.5) * this.cellSize;

        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);

        // If we reached the current target cell center, pick the next one
        if (dist < 5) {
            this.x = tx;
            this.y = ty;
            this.targetCell = this.path.length > 0 ? this.path.shift() : null;
            return;
        }

        // Move strictly toward the center of the next cell
        const angle = Math.atan2(dy, dx);
        this.angle = angle;
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }

    pursue(player, maze) {
        if (this.path.length === 0 || Math.random() < 0.05) {
            const start = { c: Math.floor(this.x / this.cellSize), r: Math.floor(this.y / this.cellSize) };
            const end = { c: Math.floor(player.x / this.cellSize), r: Math.floor(player.y / this.cellSize) };
            const newPath = this.findPath(start, end, maze);
            if (newPath.length > 0) {
                this.path = newPath;
                this.targetCell = this.path.shift();
            }
        }
    }

    patrol(maze) {
        if (!this.targetCell) {
            const start = { c: Math.floor(this.x / this.cellSize), r: Math.floor(this.y / this.cellSize) };
            let tr, tc;
            do {
                tr = Math.floor(Math.random() * maze.rows);
                tc = Math.floor(Math.random() * maze.cols);
            } while (tr === start.r && tc === start.c);
            const newPath = this.findPath(start, { r: tr, c: tc }, maze);
            if (newPath.length > 0) {
                this.path = newPath;
                this.targetCell = this.path.shift();
            }
        }
    }

    findPath(start, end, maze) {
        let q = [[start]], v = new Set();
        v.add(`${start.c},${start.r}`);
        while (q.length > 0) {
            let p = q.shift(), c = p[p.length - 1];
            if (c.c === end.c && c.r === end.r) return p;
            let neighbors = this.getNeighbors(c, maze);
            for (let n of neighbors) {
                if (!v.has(`${n.c},${n.r}`)) {
                    v.add(`${n.c},${n.r}`);
                    q.push([...p, n]);
                }
            }
        }
        return [];
    }

    getNeighbors(cell, maze) {
        let n = [], { r, c } = cell;
        let g = maze.grid[r][c];
        if (!g.walls[0] && r > 0) n.push({ r: r - 1, c: c });
        if (!g.walls[1] && c < maze.cols - 1) n.push({ r: r, c: c + 1 });
        if (!g.walls[2] && r < maze.rows - 1) n.push({ r: r + 1, c: c });
        if (!g.walls[3] && c > 0) n.push({ r: r, c: c - 1 });
        return n;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 15; ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.fillRect(this.width / 2 - 4, -this.height / 2 + 2, 4, 3);
        ctx.fillRect(this.width / 2 - 4, this.height / 2 - 5, 4, 3);
        ctx.restore();
    }
}
