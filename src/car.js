class Car {
    constructor(x, y, color = "#00f2ff") {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 0.3;
        this.friction = 0.9;
        this.maxSpeed = 4;
        this.width = 25;
        this.height = 25;
        this.color = color;
        
        this.energy = 0;
        this.maxEnergy = 100;
        this.isBoosting = false;
        this.boostTimer = 0;
        this.boostDuration = 2000;
    }

    update(controls, maze) {
        let currentMaxSpeed = this.maxSpeed;
        let currentAccel = this.acceleration;

        // Energy Penalty: 30% slower if energy is 0
        if (this.energy <= 0) {
            currentMaxSpeed *= 0.7;
            currentAccel *= 0.7;
        }

        // Boost Logic
        if (controls.boost && this.energy > 0 && !this.isBoosting) {
            this.isBoosting = true;
            this.boostTimer = Date.now();
        }

        if (this.isBoosting) {
            if (Date.now() - this.boostTimer < this.boostDuration && this.energy > 0) {
                currentMaxSpeed *= 1.8;
                currentAccel *= 2;
                this.energy -= 0.5; // Consume energy while boosting
            } else {
                this.isBoosting = false;
            }
        }

        // Input Handling (Spaceship Style)
        let inputX = 0;
        let inputY = 0;
        if (controls.forward) inputY -= 1;
        if (controls.reverse) inputY += 1;
        if (controls.left) inputX -= 1;
        if (controls.right) inputX += 1;

        // Normalize diagonal movement
        if (inputX !== 0 || inputY !== 0) {
            const mag = Math.hypot(inputX, inputY);
            this.vx += (inputX / mag) * currentAccel;
            this.vy += (inputY / mag) * currentAccel;
            
            // Set angle to movement direction
            this.angle = Math.atan2(this.vy, this.vx);
        }

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Cap speed
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > currentMaxSpeed) {
            this.vx = (this.vx / speed) * currentMaxSpeed;
            this.vy = (this.vy / speed) * currentMaxSpeed;
        }

        // Movement with collision detection
        const nextX = this.x + this.vx;
        const nextY = this.y + this.vy;

        // Check horizontal collision
        if (!maze.isWall(nextX, this.y)) {
            this.x = nextX;
        } else {
            this.vx *= -0.3; // Bounce
        }

        // Check vertical collision
        if (!maze.isWall(this.x, nextY)) {
            this.y = nextY;
        } else {
            this.vy *= -0.3; // Bounce
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Car Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Headlights
        ctx.fillStyle = "white";
        ctx.fillRect(this.width / 2 - 5, -this.height / 2 + 2, 5, 3);
        ctx.fillRect(this.width / 2 - 5, this.height / 2 - 5, 5, 3);
        
        ctx.restore();
    }
}
