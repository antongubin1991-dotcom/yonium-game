/* ============================================================
   YONIUM — GAME ENGINE (FINAL BUILD)
   Supports:
   ✔ Popups
   ✔ Minimap (15x15)
   ✔ Save system
   ✔ Building system
   ✔ Advisor
   ✔ Annual report
   ✔ Army / forging / trading
============================================================ */

/* ============================= */
/* INITIAL STATE                 */
/* ============================= */

let game = {
    year: 1450,

    pop: 1000,
    food: 3000,
    gold: 1200,
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

    buildType: null,
    buildAmount: 1,

    map: []
};

/* ============================= */
/* SAVE SYSTEM                   */
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
        console.warn("Corrupted save, resetting.");
    }
}

/* ============================= */
/* MAP GENERATION                */
/* ============================= */

const terrainTypes = ["grass", "forest", "water", "grass", "grass", "road"];

function generateMap() {
    game.map = [];
    for (let i = 0; i < 225; i++) {
        game.map.push({
            terrain: terrainTypes[Math.floor(Math.random() * terrainTypes.length)],
            building: null
        });
    }
}

function renderMap() {
    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";

    game.map.forEach(cell => {
        const div = document.createElement("div");
        div.className = "mapCell terrain-" + cell.terrain;

        if (cell.building) {
            const icon = document.createElement("div");
            icon.className = "mapIcon icon-" + cell.building;
            div.appendChild(icon);
        }

        grid.appendChild(div);
    });
}

/* ============================= */
/* UI UPDATE                     */
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

    updateRank();
    if (document.getElementById("advisor")) updateAdvisor();
    renderMap();
}

/* ============================= */
/* RANK SYSTEM                   */
/* ============================= */

function updateRank() {
    const r = document.getElementById("rank");

    if (game.pop >= 10000 && game.popularity >= 90 && game.castleLevel === 8 && game.army >= 500)
        r.innerText = "Император";
    else if (game.pop >= 5000)
        r.innerText = "Король";
    else if (game.pop >= 3000)
        r.innerText = "Принц";
    else if (game.pop >= 2000)
        r.innerText = "Герцог";
    else if (game.pop >= 1400)
        r.innerText = "Граф";
    else if (game.pop >= 1100)
        r.innerText = "Барон";
    else
        r.innerText = "Нет титула";
}

/* ============================= */
/* ADVISOR                      */
/* ============================= */

function updateAdvisor() {
    const a = document.getElementById("advisor");

    if (game.pop < 1100) a.innerText = "Набери 1100 жителей, чтобы стать Бароном.";
    else if (game.pop < 1400) a.innerText = "Для титула Графа нужно 1400 жителей.";
    else if (game.castleLevel < 1) a.innerText = "Построй замок уровня 1.";
    else if (game.army < 10) a.innerText = "Для прогресса нужна армия из 10 солдат.";
    else if (game.castleLevel < 6) a.innerText = "Укрепляй замок до 6 уровня.";
    else if (game.army < 200) a.innerText = "Нужна армия 200.";
    else if (game.gold < 100000) a.innerText = "Накопи 100 000 золота.";
    else if (game.castleLevel < 8) a.innerText = "Замок должен быть 8 уровня.";
    else if (game.army < 500) a.innerText = "Нужна армия 500.";
    else if (game.pop < 10000) a.innerText = "Достигни 10 000 жителей.";
    else if (game.popularity < 90) a.innerText = "Подними популярность до 90.";
    else a.innerText = "Ты почти Император!";
}

/* ============================= */
/* BUILDING POPUP                */
/* ============================= */

function openBuildPopup(type) {
    game.buildType = type;

    const names = {
        farm: "Ферма",
        mine: "Шахта",
        market: "Рынок",
        forge: "Кузница"
    };

    const desc = {
        farm: "Производит 500 еды в год. Стоимость: 100 золота.",
        mine: "Добывает 10 железа в год. Стоимость: 200 золота.",
        market: "Открывает торговлю. Стоимость: 300 золота.",
        forge: "Позволяет ковать оружие. Стоимость: 150 золота."
    };

    document.getElementById("buildTitle").innerText = names[type];
    document.getElementById("buildDesc").innerText = desc[type];
    document.getElementById("buildIcon").src = `assets/icons/icon_${type}.png`;

    document.getElementById("buildPopup").classList.remove("hidden");
}

function closeBuildPopup() {
    document.getElementById("buildPopup").classList.add("hidden");
}

function confirmBuild() {
    const amount = parseInt(document.getElementById("buildAmount").value);
    const price = { farm: 100, mine: 200, market: 300, forge: 150 }[game.buildType];

    if (game.gold < price * amount) {
        alert("Недостаточно золота!");
        return;
    }

    game.gold -= price * amount;
    game[game.buildType + "s"] += amount;

    // Place buildings on map
    for (let i = 0; i < amount; i++) {
        const spot = game.map.find(c => !c.building && c.terrain !== "water");
        if (spot) spot.building = game.buildType;
    }

    closeBuildPopup();
    updateUI();
    saveGame();
}

/* ============================= */
/* CASTLE UPGRADE                */
/* ============================= */

function upgradeCastle() {
    if (game.castleLevel >= 8) return alert("Замок уже максимального уровня.");

    const cost = 500 * (game.castleLevel + 1);
    if (game.gold < cost) return alert("Недостаточно золота.");

    game.gold -= cost;
    game.castleLevel++;

    updateUI();
    saveGame();
}

/* ============================= */
/* FORGING / ARMY                */
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
    if (game.pop <= 200) return alert("Не хватает граждан!");

    game.weapons--;
    game.pop--;
    game.army++;

    updateUI();
    saveGame();
}

/* ============================= */
/* TRADING                       */
/* ============================= */

function sellFood() {
    if (game.food < 100) return alert("Недостаточно еды!");
    game.food -= 100;
    game.gold += 50;
    updateUI(); saveGame();
}

function buyFood() {
    if (game.gold < 50) return alert("Недостаточно золота!");
    game.gold -= 50;
    game.food += 100;
    updateUI(); saveGame();
}

function sellIron() {
    if (game.iron < 5) return alert("Недостаточно железа!");
    game.iron -= 5;
    game.gold += 100;
    updateUI(); saveGame();
}

function buyIron() {
    if (game.gold < 100) return alert("Недостаточно золота!");
    game.gold -= 100;
    game.iron += 5;
    updateUI(); saveGame();
}

function sellWeapons() {
    if (game.weapons < 2) return alert("Недостаточно оружия!");
    game.weapons -= 2;
    game.gold += 200;
    updateUI(); saveGame();
}

function buyWeapons() {
    if (game.gold < 200) return alert("Недостаточно золота!");
    game.gold -= 200;
    game.weapons += 2;
    updateUI(); saveGame();
}

/* ============================= */
/* YEAR PROCESSING               */
/* ============================= */

function endTurn() {
    game.year++;

    // Food consumption
    game.food -= game.pop * game.foodRate;

    // Production
    game.food += game.farms * 500;
    game.iron += game.mines * 10;

    // Taxes
    game.gold += Math.floor(game.pop * (game.taxRate / 100));

    // Popularity
    if (game.foodRate > 3) game.popularity += 1;
    if (game.taxRate > 40) game.popularity -= 2;
    game.popularity = Math.max(0, Math.min(100, game.popularity));

    // Population growth
    if (game.popularity >= 50) {
        game.pop += Math.floor(game.pop * 0.04);
    }

    // Check game loss
    if (game.year >= 1500 && game.castleLevel < 8) {
        alert("Ты не успел построить Имперский замок до 1500 года.\nИгра начинается заново.");
        localStorage.removeItem("yoniumSave");
        location.reload();
        return;
    }

    // Year report
    let report = `Год ${game.year} завершён.\n`;
    report += `Налогов собрано: +${Math.floor(game.pop * (game.taxRate/100))}\n`;
    report += `Еды произведено: +${game.farms * 500}\n`;
    report += `Железа добыто: +${game.mines * 10}\n`;
    report += `Популяция: ${game.pop}\n`;
    report += `Популярность: ${game.popularity}%\n`;
    report += `Армия: ${game.army}\n`;

    showReport(report);

    updateUI();
    saveGame();
}

/* ============================= */
/* REPORT POPUP                  */
/* ============================= */

function showReport(text) {
    document.getElementById("reportText").innerText = text;
    document.getElementById("reportPanel").classList.remove("hidden");
}

function closeReport() {
    document.getElementById("reportPanel").classList.add("hidden");
}

/* ============================= */
/* INIT                           */
/* ============================= */

loadGame();
if (game.map.length === 0) generateMap();
updateUI();
renderMap();

