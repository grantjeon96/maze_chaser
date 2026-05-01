const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const minimapCanvas = document.getElementById("minimap-canvas");

let maze, player, enemies = [], minimap;
let gameState = "MENU";
let startTime;
let points = 0;
let level = 1;

const controls = { forward: false, reverse: false, left: false, right: false, boost: false };

function init() {
    resize();
    const mazeSize = 10 + level * 2;
    const cellSize = 100;
    
    maze = new Maze(mazeSize, mazeSize, cellSize);
    maze.generate();

    // Random Start Position
    player = new Car(
        (maze.startCell.c + 0.5) * cellSize,
        (maze.startCell.r + 0.5) * cellSize
    );

    // Random Enemy Spawns (far from player)
    enemies = [];
    for (let i = 0; i < level; i++) {
        let er, ec;
        do {
            er = Math.floor(Math.random() * maze.rows);
            ec = Math.floor(Math.random() * maze.cols);
        } while (Math.hypot(ec - maze.startCell.c, er - maze.startCell.r) < 5);
        enemies.push(new Enemy((ec + 0.5) * cellSize, (er + 0.5) * cellSize, cellSize));
    }

    minimap = new Minimap(minimapCanvas, maze);
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

function initUI() {
    document.getElementById("start-btn").onclick = () => {
        level = 1; points = 0;
        init(); startGame();
    };
    document.getElementById("store-btn").onclick = showStore;
    document.getElementById("back-to-menu").onclick = showMenu;
    document.getElementById("retry-btn").onclick = () => {
        init(); startGame();
    };
    document.getElementById("next-btn").onclick = () => {
        level++; init(); startGame();
    };
    
    const bBtn = document.getElementById("boost-btn");
    bBtn.onmousedown = bBtn.ontouchstart = (e) => { e.preventDefault(); controls.boost = true; };
    bBtn.onmouseup = bBtn.ontouchend = () => { controls.boost = false; };

    document.getElementById("upgrade-speed").onclick = () => upgrade('speed');
    document.getElementById("upgrade-boost").onclick = () => upgrade('boost');
    document.getElementById("buy-hypercar").onclick = buyHyperCar;
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
    } else alert("Not enough points!");
}

function buyHyperCar() {
    if (confirm("Buy Premium Hyper Car?")) {
        player.color = "gold"; player.maxSpeed = 6; player.acceleration = 0.5; player.maxEnergy = 200;
        updateHUDUI(); alert("PREMIUM HYPER CAR UNLOCKED!");
    }
}

function update() {
    player.update(controls, maze);
    enemies.forEach(e => e.update(player, maze));

    maze.items = maze.items.filter(item => {
        if (Math.hypot(player.x - (item.c+0.5)*100, player.y - (item.r+0.5)*100) < 30) {
            player.energy = Math.min(player.energy + 25, player.maxEnergy);
            points += 50; return false;
        }
        return true;
    });

    for (let e of enemies) {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 25) {
            endGame("CAPTURED"); return;
        }
    }

    const ex = (maze.exitCell.c + 0.5) * 100;
    const ey = (maze.exitCell.r + 0.5) * 100;
    if (Math.hypot(player.x - ex, player.y - ey) < 50) {
        points += 1000; endGame("ESCAPED");
    }

    if ((Date.now() - startTime) / 1000 > 300) endGame("CAPTURED");
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);
    maze.draw(ctx);
    player.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    ctx.restore();
    minimap.draw(player, enemies);
}

function updateHUD() {
    const rem = Math.max(0, 300 - Math.floor((Date.now() - startTime) / 1000));
    const m = String(Math.floor(rem / 60)).padStart(2, '0');
    const s = String(rem % 60).padStart(2, '0');
    document.getElementById("timer-display").innerText = `TIME: ${m}:${s}`;
    document.getElementById("speed-display").innerText = `SPEED: ${Math.floor(Math.abs(Math.hypot(player.vx, player.vy)) * 20)} km/h`;
    document.getElementById("points-display").innerText = `POINTS: ${points}`;
    document.getElementById("energy-bar-fill").style.width = `${(player.energy / player.maxEnergy) * 100}%`;
}

function updateHUDUI() { document.getElementById("points-display").innerText = `POINTS: ${points}`; }

function endGame(result) {
    gameState = "ENDED";
    document.getElementById("overlay").classList.remove("hidden");
    document.getElementById("menu-screen").classList.add("hidden");
    if (result === "CAPTURED") {
        document.getElementById("game-over-screen").classList.remove("hidden");
    } else {
        document.getElementById("victory-screen").classList.remove("hidden");
    }
}

function initJoystick() {
    const base = document.getElementById("joystick-base");
    const stick = document.getElementById("joystick-stick");
    const wrapper = document.getElementById("joystick-wrapper");
    if (!("ontouchstart" in window)) return;
    wrapper.style.display = "block";
    document.getElementById("boost-btn").classList.remove("hidden");
    let active = false, startPos = { x: 0, y: 0 };
    base.addEventListener("touchstart", (e) => { active = true; startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
    window.addEventListener("touchmove", (e) => {
        if (!active) return;
        const dx = e.touches[0].clientX - startPos.x, dy = e.touches[0].clientY - startPos.y;
        const dist = Math.min(Math.hypot(dx, dy), 50), angle = Math.atan2(dy, dx);
        stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
        controls.forward = dy < -10; controls.reverse = dy > 10; controls.left = dx < -10; controls.right = dx > 10;
    });
    window.addEventListener("touchend", () => { active = false; stick.style.transform = "translate(0, 0)"; controls.forward = controls.reverse = controls.left = controls.right = false; });
}

function gameLoop() {
    if (gameState === "PLAYING") { update(); draw(); updateHUD(); }
    requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (e) => handleKey(e, true));
window.addEventListener("keyup", (e) => handleKey(e, false));
window.onresize = resize;

// Start initialization
init();
initUI();
initJoystick();
requestAnimationFrame(gameLoop);
