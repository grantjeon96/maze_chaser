const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const minimapCanvas = document.getElementById("minimap-canvas");

let maze, player, enemies = [], minimap;
let gameState = "MENU";
let startTime;
let points = 0;
let level = 1;

const controls = {
    forward: false,
    reverse: false,
    left: false,
    right: false,
    boost: false
};

// Initialization
function init() {
    resize();
    
    const mazeSize = 10 + level * 2;
    const cellSize = 100;
    maze = new Maze(mazeSize, mazeSize, cellSize);
    maze.generate();

    player = new Car(cellSize / 2, cellSize / 2);
    
    // Multiple Enemies: Level 1 = 1, Level 2 = 2, etc.
    enemies = [];
    for (let i = 0; i < level; i++) {
        // Spawn enemies at different corners
        let ex = (mazeSize - 0.5) * cellSize;
        let ey = (mazeSize - 0.5) * cellSize;
        if (i % 3 === 1) ex = cellSize / 2;
        if (i % 3 === 2) ey = cellSize / 2;
        
        enemies.push(new Enemy(ex, ey, cellSize));
    }
    
    minimap = new Minimap(minimapCanvas, maze);
    
    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));
    
    initJoystick();
    initUI();
    
    requestAnimationFrame(gameLoop);
}

function handleKey(e, isDown) {
    switch(e.key) {
        case "ArrowUp": case "w": controls.forward = isDown; break;
        case "ArrowDown": case "s": controls.reverse = isDown; break;
        case "ArrowLeft": case "a": controls.left = isDown; break;
        case "ArrowRight": case "d": controls.right = isDown; break;
        case " ": controls.boost = isDown; break;
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    minimapCanvas.width = 150;
    minimapCanvas.height = 150;
}

// UI & Store Logic
function initUI() {
    document.getElementById("start-btn").onclick = () => startGame();
    document.getElementById("store-btn").onclick = () => showStore();
    document.getElementById("back-to-menu").onclick = () => showMenu();
    document.getElementById("retry-btn").onclick = () => startGame();
    document.getElementById("next-btn").onclick = () => nextLevel();
    document.getElementById("boost-btn").onclick = () => {
        controls.boost = true;
        setTimeout(() => controls.boost = false, 100);
    };

    // Store Upgrades
    document.getElementById("upgrade-speed").onclick = () => upgrade('speed');
    document.getElementById("upgrade-boost").onclick = () => upgrade('boost');
    document.getElementById("buy-hypercar").onclick = () => buyHyperCar();
}

function startGame() {
    gameState = "PLAYING";
    document.getElementById("overlay").classList.add("hidden");
    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("store-screen").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("victory-screen").classList.add("hidden");
    startTime = Date.now();
}

function showStore() {
    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("store-screen").classList.remove("hidden");
}

function showMenu() {
    document.getElementById("store-screen").classList.add("hidden");
    document.getElementById("menu-screen").classList.remove("hidden");
}

function upgrade(type) {
    if (points >= 500) {
        points -= 500;
        if (type === 'speed') player.maxSpeed += 0.5;
        if (type === 'boost') player.boostDuration += 500;
        updateHUDUI();
        alert(`${type.toUpperCase()} UPGRADED!`);
    } else {
        alert("Not enough points!");
    }
}

function buyHyperCar() {
    if (confirm("Buy Premium Hyper Car for $4.99? (Simulation)")) {
        player.color = "gold";
        player.maxSpeed = 6;
        player.acceleration = 0.5;
        player.maxEnergy = 200;
        updateHUDUI();
        alert("PREMIUM HYPER CAR UNLOCKED!");
    }
}

function nextLevel() {
    level++;
    init();
    startGame();
}

// Joystick Logic
function initJoystick() {
    const wrapper = document.getElementById("joystick-wrapper");
    const stick = document.getElementById("joystick-stick");
    const base = document.getElementById("joystick-base");
    const boostBtn = document.getElementById("boost-btn");

    if ("ontouchstart" in window) {
        wrapper.style.display = "block";
        boostBtn.classList.remove("hidden");
    } else {
        return;
    }

    let active = false;
    let startPos = { x: 0, y: 0 };

    const handleStart = (e) => {
        active = true;
        const touch = e.touches[0];
        startPos = { x: touch.clientX, y: touch.clientY };
    };

    const handleMove = (e) => {
        if (!active) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startPos.x;
        const dy = touch.clientY - startPos.y;
        const dist = Math.min(Math.hypot(dx, dy), 50);
        const angle = Math.atan2(dy, dx);

        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        stick.style.transform = `translate(${x}px, ${y}px)`;

        controls.forward = y < -10;
        controls.reverse = y > 10;
        controls.left = x < -10;
        controls.right = x > 10;
    };

    const handleEnd = () => {
        active = false;
        stick.style.transform = "translate(0, 0)";
        controls.forward = controls.reverse = controls.left = controls.right = false;
    };

    base.addEventListener("touchstart", handleStart);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
}

function gameLoop() {
    if (gameState === "PLAYING") {
        update();
        draw();
        updateHUD();
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    player.update(controls, maze);
    enemies.forEach(e => e.update(player, maze));

    // Item Collection
    maze.items = maze.items.filter(item => {
        const itemX = (item.c + 0.5) * maze.cellSize;
        const itemY = (item.r + 0.5) * maze.cellSize;
        if (Math.hypot(player.x - itemX, player.y - itemY) < 30) {
            player.energy = Math.min(player.energy + 25, player.maxEnergy);
            points += 50;
            return false;
        }
        return true;
    });

    // Enemy Collision
    for (let e of enemies) {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 25) {
            endGame("CAPTURED");
            return;
        }
    }

    // Randomized Exit Check
    const exitX = (maze.exitCell.c + 0.5) * maze.cellSize;
    const exitY = (maze.exitCell.r + 0.5) * maze.cellSize;
    if (Math.hypot(player.x - exitX, player.y - exitY) < 50) {
        points += 1000;
        endGame("ESCAPED");
    }

    // Time Limit
    if ((Date.now() - startTime) / 1000 > 300) {
        endGame("CAPTURED");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);
    
    maze.draw(ctx);
    player.draw(ctx);
    enemies.forEach(enemy => enemy.draw(ctx));
    
    ctx.restore();

    minimap.draw(player, enemies);
}

function updateHUD() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const timeLimit = 300;
    const remaining = Math.max(0, timeLimit - elapsed);
    
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    
    document.getElementById("timer-display").innerText = `TIME: ${m}:${s}`;
    document.getElementById("speed-display").innerText = `SPEED: ${Math.floor(Math.abs(Math.hypot(player.vx, player.vy)) * 20)} km/h`;
    document.getElementById("points-display").innerText = `POINTS: ${points}`;
    
    // Show status of the closest enemy
    let closestDist = Infinity;
    let closestState = "PATROL";
    enemies.forEach(e => {
        const d = Math.hypot(player.x - e.x, player.y - e.y);
        if (d < closestDist) {
            closestDist = d;
            closestState = e.state;
        }
    });
    document.getElementById("status-display").innerText = `STATUS: ${closestState}`;
    document.getElementById("energy-bar-fill").style.width = `${(player.energy / player.maxEnergy) * 100}%`;
}

function updateHUDUI() {
    document.getElementById("points-display").innerText = `POINTS: ${points}`;
}

function endGame(result) {
    gameState = "ENDED";
    document.getElementById("overlay").classList.remove("hidden");
    if (result === "CAPTURED") {
        document.getElementById("game-over-screen").classList.remove("hidden");
    } else {
        document.getElementById("victory-screen").classList.remove("hidden");
        document.getElementById("reward-text").innerText = `보상: 1000 POINTS (TOTAL: ${points})`;
    }
}

window.onresize = resize;
init();
