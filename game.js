/* ============================================================
   ИГРОВОЕ СОСТОЯНИЕ
============================================================ */

let game = {
    year: 1450,
    pop: 1000,          // жители
    food: 5000,         // еда
    gold: 500,          // золото
    iron: 0,            // железо
    weapons: 0,         // оружие
    army: 0,            // солдаты
    popularity: 50,     // %
    castleLevel: 0,     // до 8
    taxRate: 30,        // %
    foodRate: 3,        // еда на чел
    rank: "Крестьянин",

    buildings: {
        farm: 0,
        mine: 0,
        market: 0,
        forge: 0
    }
};

/* ============================================================
   ТИТУЛЫ
============================================================ */
const RANKS = [
    { reqPop: 0,    reqPopul: 0,  title: "Крестьянин" },
    { reqPop: 1000, reqPopul: 55, title: "Батрак" },
    { reqPop: 2000, reqPopul: 60, title: "Барон" },
    { reqPop: 4000, reqPopul: 65, title: "Властелин" },
    { reqPop: 7000, reqPopul: 70, title: "Герцог" },
    { reqPop: 12000,reqPopul: 75, title: "Король" }
];

/* ============================================================
   МИНИ-КАРТА
============================================================ */

const mapSize = 12;
let map = [];

const terrainTypes = {
    grass: "terrain-grass",
    forest: "terrain-forest",
    water: "terrain-water",
    road: "terrain-road"
};

function generateMap() {
    map = [];
    for (let y = 0; y < mapSize; y++) {
        let row = [];
        for (let x = 0; x < mapSize; x++) {
            const r = Math.random();
            if (r < 0.05) row.push("water");
            else if (r < 0.25) row.push("forest");
            else if (r < 0.3) row.push("road");
            else row.push("grass");
        }
        map.push(row);
    }
}

function renderMap() {
    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";

    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            const cell = document.createElement("div");
            cell.className = "mapCell " + terrainTypes[map[y][x]];
            grid.appendChild(cell);
        }
    }
}

/* ============================================================
   ПОСТРОЙКА ПОПАП
============================================================ */

function openBuildPopup(type, title, cost, icon) {
    const p = document.getElementById("popup");
    const img = document.getElementById("popupIcon");
    const t = document.getElementById("popupTitle");
    const c = document.getElementById("popupCost");

    img.src = icon;
    t.innerText = title;
    c.innerText = cost;

    p.classList.remove("hidden");

    document.getElementById("popupConfirm").onclick = function () {
        build(type);
        closePopup();
    };
}

function closePopup() {
    document.getElementById("popup").classList.add("hidden");
}

/* ============================================================
   ПОСТРОЙКИ
============================================================ */

function build(type) {
    switch (type) {

        case "farm":
            if (game.gold < 100) return alert("Недостаточно золота");
            game.gold -= 100;
            game.buildings.farm++;
            game.food += 500;
            break;

        case "mine":
            if (game.gold < 200) return alert("Недостаточно золота");
            game.gold -= 200;
            game.buildings.mine++;
            game.iron += 10;
            break;

        case "market":
            if (game.gold < 300) return alert("Недостаточно золота");
            game.gold -= 300;
            game.buildings.market++;
            game.popularity += 2;
            break;

        case "forge":
            if (game.gold < 150) return alert("Недостаточно золота");
            game.gold -= 150;
            game.buildings.forge++;
            break;

        case "castle":
            if (game.gold < 500) return alert("Недостаточно золота");
            if (game.castleLevel >= 8) return alert("Замок максимального уровня");
            game.gold -= 500;
            game.castleLevel++;
            break;
    }

    updateUI();
}

/* ============================================================
   АРМИЯ
============================================================ */

function craftWeapon() {
    if (game.iron < 10) return alert("Нет железа");
    game.iron -= 10;
    game.weapons++;
    updateUI();
}

function hireSoldier() {
    if (game.weapons < 1 || game.food < 20) return alert("Нужно оружие и еда");
    game.weapons--;
    game.food -= 20;
    game.army++;
    updateUI();
}

/* ============================================================
   ТОРГОВЛЯ
============================================================ */

function sellFood() { game.food -= 100; game.gold += 30; updateUI(); }
function buyFood()  { game.food += 100; game.gold -= 40; updateUI(); }

function sellIron() { if (game.iron < 5) return; game.iron -= 5; game.gold += 25; updateUI(); }
function buyIron()  { game.iron += 5; game.gold -= 35; updateUI(); }

function sellWeapons() { if (game.weapons < 1) return; game.weapons--; game.gold += 70; updateUI(); }
function buyWeapons()  { game.weapons++; game.gold -= 90; updateUI(); }

/* ============================================================
   ОТЧЁТ ЗА ГОД
============================================================ */

function endTurn() {
    game.year++;

    game.pop += Math.floor(game.pop * 0.02);

    const foodNeed = game.pop * game.foodRate;
    game.food -= foodNeed;

    game.gold += Math.floor((game.pop * game.taxRate) / 100);

    if (game.food < 0) {
        game.popularity -= 5;
        game.pop = Math.floor(game.pop * 0.9);
    }

    updateRank();
    updateUI();
    showReport(foodNeed);
}

function updateRank() {
    for (let r of RANKS) {
        if (game.pop >= r.reqPop && game.popularity >= r.reqPopul) {
            game.rank = r.title;
        }
    }
}

function showReport(foodSpent) {
    const txt = `
Год: ${game.year}
Потрачено еды: ${foodSpent}
Доход от налогов: ${Math.floor((game.pop * game.taxRate) / 100)}
Население: ${game.pop}
Популярность: ${game.popularity}%
Титул: ${game.rank}
`;

    document.getElementById("reportText").innerText = txt;
    document.getElementById("reportPanel").classList.remove("hidden");
}

function closeReport() {
    document.getElementById("reportPanel").classList.add("hidden");
}

/* ============================================================
   ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
============================================================ */

function updateUI() {
    document.getElementById("year").innerText = game.year;

    document.getElementById("pop").innerText = game.pop;
    document.getElementById("food").innerText = game.food;
    document.getElementById("gold").innerText = game.gold;
    document.getElementById("iron").innerText = game.iron;
    document.getElementById("weapons").innerText = game.weapons;
    document.getElementById("army").innerText = game.army;
    document.getElementById("popularity").innerText = game.popularity + "%";
    document.getElementById("castle").innerText = game.castleLevel + "/8";
    document.getElementById("rank").innerText = game.rank;

    document.getElementById("taxRate").value = game.taxRate;
    document.getElementById("foodRate").value = game.foodRate;

    document.getElementById("advisor").innerText =
        `Титул: ${game.rank}\n\n` +
        `Наберите ${Math.max(0, RANKS.find(r => r.title !== game.rank).reqPop - game.pop || 0)} жителей ` +
        `и ${Math.max(0, RANKS.find(r => r.title !== game.rank).reqPopul - game.popularity || 0)}% популярности.`;
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
============================================================ */

window.onload = function () {
    generateMap();
    renderMap();

    document.getElementById("taxRate").oninput = () => {
        game.taxRate = Number(document.getElementById("taxRate").value);
    };

    document.getElementById("foodRate").oninput = () => {
        game.foodRate = Number(document.getElementById("foodRate").value);
    };

    updateUI();
};
