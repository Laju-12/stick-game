const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ======================
// 월드
// ======================

const world = {
    width: 1000,
    height: 1000
};

// ======================
// 카메라
// ======================

const camera = {
    x: 0,
    y: 0
};

// ======================
// 상태
// ======================

let mapOpen = false;
let criticalTexts = [];
let outlineTime = 0;

let mouseX = 0;
let mouseY = 0;

// ======================
// 플레이어
// ======================

const player = {

    x: 300,
    y: 300,

    width: 40,
    height: 40,

    speed: 3.5,

    hp: 20,
maxHp: 20,

    dead: false,

    jumpHeight: 0,
    jumpVelocity: 0,
    gravity: 0.35,

    jumping: false,

    hasStick: false,

    attacking: false,
    attackAngle: 0,

    lastAttack: 0
};

// ======================
// 몹
// ======================

const enemies = [];

for (let i = 0; i < 4; i++) {

    enemies.push(createEnemy());
}

function createEnemy() {

    return {

        x: Math.random() * world.width,
        y: Math.random() * world.height,

        size: 40,

        hp: 10,

        alive: true,

        chasing: false,

        moveX: Math.random() * 2 - 1,
        moveY: Math.random() * 2 - 1,

        changeDirectionTimer: 0,

        respawnTimer: 0,

        lastAttack: 0
    };
}

// ======================
// 막대기
// ======================

const stick = {

    x: Math.random() * world.width,
    y: Math.random() * world.height,

    width: 50,
    height: 10,

    picked: false
};

// ======================
// 마우스
// ======================

canvas.addEventListener("mousemove", (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener("click", () => {

    if (!player.dead) return;

    const buttonWidth = 220;
    const buttonHeight = 70;

    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 20;

    const hover =
        mouseX > buttonX &&
        mouseX < buttonX + buttonWidth &&
        mouseY > buttonY &&
        mouseY < buttonY + buttonHeight;

    if (hover) {

        resetGame();
    }
});

// ======================
// 키 입력
// ======================

const keys = {};

document.addEventListener("keydown", (e) => {

    if (player.dead) return;

    const key = e.key.toLowerCase();

    keys[key] = true;

    // 점프
    if (e.code === "Space" && !player.jumping) {

        player.jumping = true;

        player.jumpVelocity = 6;
    }

    // 줍기
    if (key === "f") {

        const dx = player.x - stick.x;
        const dy = player.y - stick.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 70 && !stick.picked) {

            stick.picked = true;

            player.hasStick = true;
        }
    }

    // 공격
    if (key === "q") {

        const now = Date.now();

        if (
            player.hasStick &&
            !player.attacking &&
            now - player.lastAttack >= 1000
        ) {

            player.attacking = true;

            player.attackAngle = 0;

            player.lastAttack = now;

            for (const enemy of enemies) {

                if (!enemy.alive) continue;

                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {

                    enemy.chasing = true;

                    let damage = 1;

                    // 크리티컬
                    if (Math.random() < 0.25) {

                        damage *= 2;

                        criticalTexts.push({

                            x: enemy.x,
                            y: enemy.y,

                            alpha: 1,
                            offsetY: 0
                        });
                    }

                    enemy.hp -= damage;

                    if (enemy.hp <= 0) {

                        enemy.alive = false;

                        enemy.respawnTimer = 600;
                    }
                }
            }
        }
    }

    // 지도
    if (key === "m") {

        mapOpen = !mapOpen;
    }
});

document.addEventListener("keyup", (e) => {

    const key = e.key.toLowerCase();

    keys[key] = false;
});

// ======================
// 게임 리셋
// ======================

function resetGame() {

    player.x = 300;
    player.y = 300;

    player.hp = player.maxHp;

    player.dead = false;

    player.hasStick = false;

    stick.picked = false;

    stick.x = Math.random() * world.width;
    stick.y = Math.random() * world.height;

    enemies.length = 0;

    for (let i = 0; i < 4; i++) {

        enemies.push(createEnemy());
    }
}

// ======================
// 업데이트
// ======================

function update() {

    if (player.dead) return;

    // 이동
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // 맵 제한
    player.x = Math.max(
        0,
        Math.min(world.width - player.width, player.x)
    );

    player.y = Math.max(
        0,
        Math.min(world.height - player.height, player.y)
    );

    // 카메라
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // 점프
    if (player.jumping) {

        player.jumpHeight += player.jumpVelocity;

        player.jumpVelocity -= player.gravity;

        if (player.jumpHeight <= 0) {

            player.jumpHeight = 0;

            player.jumping = false;
        }
    }

    // 공격 모션
    if (player.attacking) {

        player.attackAngle += 6;

        if (player.attackAngle >= 90) {

            player.attackAngle = 0;

            player.attacking = false;
        }
    }

    // 몹 AI
    for (const enemy of enemies) {

        // 죽음
        if (!enemy.alive) {

            enemy.respawnTimer--;

            if (enemy.respawnTimer <= 0) {

                enemy.alive = true;

                enemy.hp = 10;

                enemy.x = Math.random() * world.width;
                enemy.y = Math.random() * world.height;

                enemy.chasing = false;
            }

            continue;
        }

        // 추적
        if (enemy.chasing) {

            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {

                enemy.x += (dx / distance) * 2.5;
                enemy.y += (dy / distance) * 2.5;
            }

            // 공격
            if (distance < 55) {

                const now = Date.now();

                if (now - enemy.lastAttack > 1000) {

                    player.hp -= 0.5;

                    enemy.lastAttack = now;

                    if (player.hp <= 0) {

                        player.hp = 0;

                        player.dead = true;
                    }
                }
            }
        }
        else {

            enemy.changeDirectionTimer--;

            if (enemy.changeDirectionTimer <= 0) {

                enemy.moveX = Math.random() * 2 - 1;
                enemy.moveY = Math.random() * 2 - 1;

                enemy.changeDirectionTimer = 120;
            }

            enemy.x += enemy.moveX * 0.5;
            enemy.y += enemy.moveY * 0.5;
        }

        // 맵 제한
        enemy.x = Math.max(
            0,
            Math.min(world.width - enemy.size, enemy.x)
        );

        enemy.y = Math.max(
            0,
            Math.min(world.height - enemy.size, enemy.y)
        );
    }

    outlineTime += 0.03;
}

// ======================
// 격자
// ======================

function drawGrid() {

    ctx.strokeStyle = "#4d914d";

    for (let x = 0; x < world.width; x += 100) {

        ctx.beginPath();

        ctx.moveTo(x - camera.x, 0 - camera.y);

        ctx.lineTo(x - camera.x, world.height - camera.y);

        ctx.stroke();
    }

    for (let y = 0; y < world.height; y += 100) {

        ctx.beginPath();

        ctx.moveTo(0 - camera.x, y - camera.y);

        ctx.lineTo(world.width - camera.x, y - camera.y);

        ctx.stroke();
    }
}

// ======================
// 플레이어
// ======================

function drawPlayer() {

    // 그림자
    ctx.fillStyle = "rgba(0,0,0,0.3)";

    ctx.beginPath();

    ctx.ellipse(
        player.x - camera.x + 20,
        player.y - camera.y + 38,
        18,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // 몸
    ctx.fillStyle = "#2d7dff";

    ctx.fillRect(
        player.x - camera.x,
        player.y - camera.y - player.jumpHeight,
        player.width,
        player.height
    );

    // 막대기
    if (player.hasStick) {

        ctx.save();

        ctx.translate(
            player.x - camera.x + 20,
            player.y - camera.y + 20 - player.jumpHeight
        );

        ctx.rotate(
            (-90 + player.attackAngle) * Math.PI / 180
        );

        ctx.fillStyle = "#8b5a2b";

        ctx.fillRect(
            0,
            -4,
            45,
            8
        );

        ctx.restore();
    }
}

// ======================
// 몹
// ======================

function drawEnemy() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        ctx.fillStyle = "red";

        ctx.fillRect(
            enemy.x - camera.x,
            enemy.y - camera.y,
            enemy.size,
            enemy.size
        );

        // 체력바 배경
        ctx.fillStyle = "black";

        ctx.fillRect(
            enemy.x - camera.x,
            enemy.y - camera.y - 15,
            40,
            6
        );

        // 체력바
        ctx.fillStyle = "lime";

        ctx.fillRect(
            enemy.x - camera.x,
            enemy.y - camera.y - 15,
            enemy.hp * 4,
            6
        );
    }
}

// ======================
// 크리티컬
// ======================

function drawCriticalTexts() {

    for (let i = criticalTexts.length - 1; i >= 0; i--) {

        const text = criticalTexts[i];

        text.offsetY += 0.5;

        text.alpha -= 0.02;

        ctx.globalAlpha = text.alpha;

        ctx.fillStyle = "yellow";

        ctx.font = "18px Arial";

        ctx.fillText(
            "크리티컬!",
            text.x - camera.x,
            text.y - camera.y - 30 - text.offsetY
        );

        ctx.globalAlpha = 1;

        if (
            text.offsetY >= 20 ||
            text.alpha <= 0
        ) {

            criticalTexts.splice(i, 1);
        }
    }
}

// ======================
// 막대기
// ======================

function drawStick() {

    if (stick.picked) return;

    const screenX = stick.x - camera.x;
    const screenY = stick.y - camera.y;

    const dx = player.x - stick.x;
    const dy = player.y - stick.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    const near = distance < 120;

    // 색상 변화
    const blend = (Math.sin(outlineTime) + 1) / 2;

    const r = 255;
    const g = Math.floor(255 - (blend * 40));
    const b = Math.floor(255 - (blend * 255));

    const color = `rgb(${r},${g},${b})`;

    // 테두리 크기
    const outlineSize = near ? 5 : 3;

    // 테두리
    ctx.strokeStyle = color;

    ctx.lineWidth = outlineSize;

    ctx.strokeRect(
        screenX,
        screenY,
        stick.width,
        stick.height
    );

    // 막대기
    ctx.fillStyle = "#8b5a2b";

    ctx.fillRect(
        screenX,
        screenY,
        stick.width,
        stick.height
    );

    // 텍스트
    if (near) {

        ctx.fillStyle = color;

        ctx.font = "24px Arial";

        ctx.fillText(
            "[ F ] 줍기",
            screenX - 10,
            screenY - 20
        );
    }
}

// ======================
// 미니맵
// ======================

function drawMiniMap() {

    const miniX = canvas.width - 180;
    const miniY = 20;
    const miniSize = 140;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        miniX + miniSize / 2,
        miniY + miniSize / 2,
        miniSize / 2,
        0,
        Math.PI * 2
    );

    ctx.clip();

    ctx.fillStyle = "#1d4d1d";

    ctx.fillRect(
        miniX,
        miniY,
        miniSize,
        miniSize
    );

    // 격자
    ctx.strokeStyle = "rgba(255,255,255,0.15)";

    for (let x = 0; x < miniSize; x += miniSize / 8) {

        ctx.beginPath();

        ctx.moveTo(miniX + x, miniY);

        ctx.lineTo(miniX + x, miniY + miniSize);

        ctx.stroke();
    }

    for (let y = 0; y < miniSize; y += miniSize / 8) {

        ctx.beginPath();

        ctx.moveTo(miniX, miniY + y);

        ctx.lineTo(miniX + miniSize, miniY + y);

        ctx.stroke();
    }

    // 플레이어
    ctx.fillStyle = "blue";

    ctx.beginPath();

    ctx.arc(
        miniX + (player.x / world.width) * miniSize,
        miniY + (player.y / world.height) * miniSize,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // 몹
    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        ctx.fillStyle = "red";

        ctx.beginPath();

        ctx.arc(
            miniX + (enemy.x / world.width) * miniSize,
            miniY + (enemy.y / world.height) * miniSize,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();

    // 테두리
    ctx.strokeStyle = "white";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.arc(
        miniX + miniSize / 2,
        miniY + miniSize / 2,
        miniSize / 2,
        0,
        Math.PI * 2
    );

    ctx.stroke();
}

// ======================
// 사망 화면
// ======================

function drawDeathScreen() {

    if (!player.dead) return;

    // 무채색
    ctx.fillStyle = "rgba(120,120,120,0.5)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // 사망 텍스트
    ctx.fillStyle = "white";

    ctx.font = "bold 80px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "사망",
        canvas.width / 2,
        canvas.height / 2 - 80
    );

    // 버튼
    const buttonWidth = 220;
    const buttonHeight = 70;

    let scale = 1;

    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 20;

    const hover =
        mouseX > buttonX &&
        mouseX < buttonX + buttonWidth &&
        mouseY > buttonY &&
        mouseY < buttonY + buttonHeight;

    if (hover) {

        scale = 1.08;
    }

    ctx.save();

    ctx.translate(
        canvas.width / 2,
        buttonY + buttonHeight / 2
    );

    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(255,255,255,0.15)";

    ctx.fillRect(
        -buttonWidth / 2,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight
    );

    ctx.strokeStyle = "white";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        -buttonWidth / 2,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight
    );

    ctx.fillStyle = "white";

    ctx.font = "36px Arial";

    ctx.fillText(
        "살아나기",
        0,
        12
    );

    ctx.restore();

    ctx.textAlign = "start";
}

// ======================
// UI
// ======================

function drawText() {

    ctx.fillStyle = "white";

    ctx.font = "24px Arial";

    ctx.fillText(
        "HP : " + player.hp,
        20,
        40
    );

    ctx.fillText(
        "Q 공격 / F 줍기 / M 지도",
        20,
        75
    );
}

// ======================
// 그리기
// ======================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // 배경
    ctx.fillStyle = "#3d7a3d";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawGrid();

    drawStick();

    drawEnemy();

    drawCriticalTexts();

    drawPlayer();

    drawMiniMap();

    drawText();

    drawDeathScreen();
}

// ======================
// 반복
// ======================

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();