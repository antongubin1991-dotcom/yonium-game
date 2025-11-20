/* ============================================================
   ГЛАВНОЕ СОСТОЯНИЕ ИГРЫ
============================================================ */

const game = {
    year: 1450,

    pop: 800,
    food: 2000,
    gold: 1200,
    iron: 0,
    weapons: 0,
    army: 0,
    popularity: 50,

    farms: 0,
    mines: 0,
    markets: 0,
    forges: 0,
    castle: 0,

    taxRate: 30,
    foodRate: 3,

    terrain: [],   // мини-карта 10×10
};


/* ============================================================
   СОХРАНЕНИЕ / ЗАГРУЗКА
============================================================ */

function saveGame() {
    localStorage.setItem("darkEmpireSave", JSON.stringify(game));
}

function loadGame() {
    const data = localStorage.getItem("darkEmpireSave");
    if (data) {
        Object.assign(game, JSON.parse(data));
    }
}


/* ============================================================
   МИНИ-КАРТА — ГЕНЕРАЦИЯ
============================================================ */

const terrainTypes = ["grass", "grass", "forest", "water", "road"];

function generateMap() {
    if (game.terrain.length === 100) return; // Уже есть — не пересоздаём

    game.terrain = [];

    for (let i = 0; i < 100; i++) {
        const t = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        game.terrain.push(t);
    }
}

function renderMap() {
    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";

    game.terrain.forEach((type, index) => {
        const cell = document.createElement("div");
        cell.className = "mapCell terrain-" + type;

        // Если тут здание
        if (game.buildings && game.buildings[index]) {
            const icon = document.createElement("div");
            icon.className = "mapIcon " + game.buildings[index];
            cell.appendChild(icon);
        }

        grid.appendChild(cell);
    });
}


/* ============================================================
   ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
============================================================ */

function updateUI() {
    document.getElementById("yearLabel").innerText = "Год: " + game.year;

    document.getElementById("pop").innerText = game.pop;
    document.getElementById("food").innerText = game.food;
    document.getElementById("gold").innerText = game.gold;
    document.getElementById("iron").innerText = game.iron;
    document.getElementById("weapons").innerText = game.weapons;
    document.getElementById("army").innerText = game.army;
    document.getElementById("popularity").innerText = game.popularity + "%";
    document.getElementById("castle").innerText = game.castle;

    updateAdvisor();
    renderMap();
}


/* ============================================================
   СОВЕТНИК
============================================================ */

function updateAdvisor() {
    const el = document.getElementById("advisorText");

    if (!el) return;

    const nextRank =
        game.pop < 1100 ? "Барон"
        : game.pop < 1400 ? "Граф"
        : game.pop < 2000 ? "Герцог"
        : game.pop < 3000 ? "Принц"
        : game.pop < 5000 ? "Король"
        : "Император";

    el.innerText =
        "→ Текущий рейтинг: " + nextRank + "\n\n" +
        "Чтобы улучшить положение:\n" +
        "• увеличивайте население\n" +
        "• развивайте замок\n" +
        "• следите за популярностью\n";
}


/* ============================================================
   ПОСТРОЙКИ (открытие pop-up и логика)
============================================================ */

function openBuildPopup(type, icon, cost, desc) {
    const popup = document.getElementById("buildPopup");
    const title = document.getElementById("buildTitle");
    const body = document.getElementById("buildBody");
    const btn = document.getElementById("buildConfirm");

    popup.classList.remove("hidden");

    title.innerText = desc;
    body.innerHTML = `
        <div style="text-align:center">
            <img src="${icon}" width="80">
        </div>
        <p style="margin-top:10px">Стоимость: <b>${cost} золота</b></p>
    `;

    btn.onclick = function () {
        if (game.gold < cost) {
            alert("Недостаточно золота!");
            return;
        }

        game.gold -= cost;

        if (type === "farm") game.farms++;
        if (type === "mine") game.mines++;
        if (type === "market") game.markets++;
        if (type === "forge") game.forges++;

        // Добавляем здание на карту
        placeRandomBuilding(type);

        closeBuildPopup();
        updateUI();
        saveGame();
    };
}

function closeBuildPopup() {
    document.getElementById("buildPopup").classList.add("hidden");
}


/* ============================================================
   РАЗМЕЩЕНИЕ ЗДАНИЯ НА КАРТЕ
============================================================ */

if (!game.buildings) game.buildings = {};

function placeRandomBuilding(type) {
    let icon =
        type === "farm" ? "icon-farm" :
        type === "mine" ? "icon-mine" :
        type === "market" ? "icon-market" :
        type === "forge" ? "icon-forge" :
        "icon-castle";

    // Ищем свободную клетку
    let idx = -1;
    let limit = 200;
    while (limit-- > 0) {
        let r = Math.floor(Math.random() * 100);
        if (!game.buildings[r]) {
            idx = r;
            break;
        }
    }

    if (idx !== -1) game.buildings[idx] = icon;
}


/* ============================================================
   ЕЖЕГОДНОЕ ОБНОВЛЕНИЕ
============================================================ */

function endYear() {
    game.year++;

    // Производство
    game.food += game.farms * 500;
    game.iron += game.mines * 10;

    // Налоги
    const taxIncome = Math.floor(game.pop * (game.taxRate / 100));
    game.gold += taxIncome;

    // Потребление еды
    const foodNeed = game.pop * game.foodRate;
    game.food -= foodNeed;

    if (game.food < 0) {
        game.popularity -= 5;
        game.pop += Math.floor(game.food / 10);
        if (game.pop < 200) game.pop = 200;
        game.food = 0;
    } else {
        game.popularity += 2;
        game.pop += Math.floor(game.pop * 0.02);
    }

    if (game.popularity > 100) game.popularity = 100;
    if (game.popularity < 0) game.popularity = 0;

    updateUI();
    saveGame();
}


/* ============================================================
   СОЛДАТЫ И ОРУЖИЕ
============================================================ */

function craftWeapon() {
    if (game.iron < 1) return alert("Нет железа!");

    game.iron--;
    game.weapons++;

    updateUI();
    saveGame();
}

function hireSoldier() {
    if (game.weapons < 1) return alert("Нет оружия!");
    if (game.pop < 201) return alert("Нужно минимум 200 жителей!");

    game.weapons--;
    game.pop--;
    game.army++;

    updateUI();
    saveGame();
}


/* ============================================================
   НАСТРОЙКИ НАЛОГОВ И ПИЩИ
============================================================ */

document.getElementById("taxRate").oninput = e => {
    game.taxRate = Number(e.target.value);
    saveGame();
};

document.getElementById("foodRate").oninput = e => {
    game.foodRate = Number(e.target.value);
    saveGame();
};


/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
============================================================ */

loadGame();
generateMap();
updateUI();
renderMap();
