/* ============================================================
   YONIUM — GAME ENGINE (FINAL VERSION)
   Supports:
   ✔ Popups
   ✔ Minimap
   ✔ Save system
   ✔ Advisor logic
   ✔ Original Dark Emperor mechanics
============================================================ */

/* ============================= */
/*           GAME STATE          */
/* ============================= */

let game = {
    year: 1450,

    pop: 1000,
    food: 2000,
    gold: 1500,
    iron: 0,
    weapons: 0,
    army: 0,
    popularity: 50,

    farms: 0,
    mines: 0,
    markets: 0,
    forges: 0,

    castleLevel: 0,

    taxRate: 30,
    foodRate: 3,

    map: [],

    buildType: null,
};

/* ============================= */
/*         LOCAL STORAGE         */
/* ============================= */

function saveGame() {
    localStorage.setItem("yoniumSave", JSON.stringify(game));
}

function loadGame() {
    const data = localStorage.getItem("yoniumSave");
    if (!data) return;

    try {
        game = JSON.parse(data);
    } catch {
        console.warn("Ошибка загрузки сохранений — перезапуск.");
    }
}


/* ============================= */
/*       MINIMAP GENERATION      */
/* ============================= */

const terrain = ["grass", "forest", "water", "grass", "grass", "road"];

function generateMap() {
    game.map = [];

    for (let i = 0; i < 100; i++) {
        game.map.push({
            type: terrain[Math.floor(Math.random() * terrain.length)],
            building: null
        });
    }
}

function renderMap() {
    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";

    game.map.forEach(cell => {
        const div = document.createElement("div");
        div.className = "mapCell terrain-" + cell.type;

        if (cell.building) {
            const icon = document.createElement("div");
            icon.className = "mapIcon icon-" + cell.building;
            div.appendChild(icon);
        }

        grid.appendChild(div);
    });
}


/* ============================= */
/*        UI UPDATE FUNCTION     */
/* ============================= */

function updateUI() {
    document.getElementById("yearLabel").innerText = `Год: ${game.year}`;

    document.getElementById("pop").innerText = game.pop;
    document.getElementById("food").innerText = game.food;
    document.getElementById("gold").innerText = game.gold;
    document.getElementById("iron").innerText = game.iron;
    document.getElementById("weapons").innerText = game.weapons;
    document.getElementById("army").innerText = game.army;
    document.getElementById("popularity").innerText = game.popularity;
    document.getElementById("castle").innerText = game.castleLevel;

    updateAdvisor();
    renderMap();
}


/* ============================= */
/*            ADVISOR            */
/* ============================= */

function updateAdvisor() {
    const a = document.getElementById("advisor");

    if (game.pop < 1100) a.innerText = "Нужно 1100 жителей, чтобы стать Бароном.";
    else if (game.pop < 1400) a.innerText = "Стань Графом — набери 1400 жителей.";
    else if (game.castleLevel < 1) a.innerText = "Построй замок уровня 1.";
    else if (game.army < 10) a.innerText = "Нанимай солдат — нужно 10.";
    else if (game.castleLevel < 6) a.innerText = "Укрепляй замок — 6 уровень.";
    else if (game.army < 200) a.innerText = "Нужна армия 200 человек.";
    else if (game.gold < 100000) a.innerText = "Собери 100 000 золота.";
    else if (game.castleLevel < 8) a.innerText = "Заверши постройку замка.";
    else if (game.army < 500) a.innerText = "Армия должна быть 500.";
    else if (game.pop < 10000) a.innerText = "Нужно 10 000 жителей.";
    else if (game.popularity < 90) a.innerText = "Повышай популярность.";
    else {
        a.innerText = "Ты стал Императором!";
    }
}


/* ============================= */
/*         CASTLE UPGRADE        */
/* ============================= */

function upgradeCastle() {
    if (game.castleLevel >= 8) return alert("Замок уже максимального уровня!");

    if (game.gold < 500 * (game.castleLevel + 1))
        return alert("Недостаточно золота!");

    game.gold -= 500 * (game.castleLevel + 1);
    game.castleLevel++;

    const castle = document.getElementById("castleImage");
    castle.classList.add("castle-upgrade");
    setTimeout(() => castle.classList.remove("castle-upgrade"), 800);

    updateUI();
    saveGame();
}


/* ============================= */
/*           POPUPS              */
/* ============================= */

function openBuildPopup(type) {
    game.buildType = type;

    const popup = document.getElementById("popupOverlay");
    const title = document.getElementById("popupTitle");
    const desc = document.getElementById("popupDesc");

    const names = {
        farm: "Ферма",
        mine: "Шахта",
        market: "Рынок",
        forge: "Кузница"
    };

    const descs = {
        farm: "Производит 500 еды в год. Стоимость: 100 золота.",
        mine: "Добывает 10 железа в год. Стоимость: 200 золота.",
        market: "Открывает торговлю. Стоимость: 300 золота.",
        forge: "Позволяет ковать оружие. Стоимость: 150 золота."
    };

    title.innerText = names[type];
    desc.innerText = descs[type];

    popup.style.display = "flex";
}

function closePopup() {
    document.getElementById("popupOverlay").style.display = "none";
}

function confirmBuild(count) {
    const prices = {
        farm: 100,
        mine: 200,
        market: 300,
        forge: 150
    };

    const price = prices[game.buildType] * count;

    if (game.gold < price) return alert("Недостаточно золота!");

    game.gold -= price;

    game[game.buildType + "s"] += count;

    // add to map
    for (let i = 0; i < count; i++) {
        const empty = game.map.find(c => !c.building);
        if (empty) {
            empty.building = game.buildType;
        }
    }

    closePopup();
    updateUI();
    saveGame();
}


/* ============================= */
/*            FORGE / ARMY       */
/* ============================= */

function craftWeapon() {
    if (game.iron < 1) return alert("Нет железа!");
    game.iron--;
    game.weapons++;
    updateUI();
    saveGame();
}

function hireSoldier() {
    if (game.weapons < 1) return alert("Нет оружия!");
    if (game.pop < 200) return alert("Не хватает граждан!");

    game.weapons--;
    game.pop--;
    game.army++;

    updateUI();
    saveGame();
}


/* ============================= */
/*             TRADE             */
/* ============================= */

function sellFood() { if (game.food >= 100) game.food -= 100, game.gold += 50; updateUI(); saveGame(); }
function buyFood() { if (game.gold >= 50) game.gold -= 50, game.food += 100; updateUI(); saveGame(); }

function sellIron() { if (game.iron >= 5) game.iron -= 5, game.gold += 100; updateUI(); saveGame(); }
function buyIron() { if (game.gold >= 100) game.gold -= 100, game.iron += 5; updateUI(); saveGame(); }

function sellWeapons() { if (game.weapons >= 2) game.weapons -= 2, game.gold += 200; updateUI(); saveGame(); }
function buyWeapons() { if (game.gold >= 200) game.gold -= 200, game.weapons += 2; updateUI(); saveGame(); }


/* ============================= */
/*           YEAR END            */
/* ============================= */

function endTurn() {
    game.year++;

    // food consumption
    game.food -= game.pop * game.foodRate;

    // food production
    game.food += game.farms * 500;

    // mining
    game.iron += game.mines * 10;

    // taxes
    game.gold += Math.floor(game.pop * (game.taxRate / 100));

    // popularity
    game.popularity += (game.foodRate - 3) * 2;
    if (game.taxRate > 40) game.popularity -= 2;

    game.popularity = Math.max(0, Math.min(100, game.popularity));

    // population growth
    if (game.popularity > 50) game.pop += Math.floor(game.pop * 0.05);

    // defeat
    if (game.year >= 1500 && game.castleLevel < 8) {
        alert("Ты не успел стать Императором до 1500 года.\nИгра начинается заново.");
        localStorage.removeItem("yoniumSave");
        location.reload();
        return;
    }

    updateUI();
    saveGame();

    // report
    showReport();
}


/* ============================= */
/*           REPORT POPUP        */
/* ============================= */

function showReport() {
    const report = `
Год: ${game.year}
Налоги: +${Math.floor(game.pop * (game.taxRate/100))}
Фермы дали еды: +${game.farms * 500}
Шахты добыли железо: +${game.mines * 10}
Популяция: ${game.pop}
Популярность: ${game.popularity}
Армия: ${game.army}
`;

    document.getElementById("reportText").innerText = report;
    document.getElementById("reportPanel").classList.remove("hidden");
}

function closeReport() {
    document.getElementById("reportPanel").classList.add("hidden");
}


/* ============================= */
/*        INITIALIZATION         */
/* ============================= */

loadGame();
if (!game.map.length) generateMap();
updateUI();
renderMap();
