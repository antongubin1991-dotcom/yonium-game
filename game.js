/* ============================================================
    Империя Тьмы — основной движок
============================================================ */

/* --------- СОСТОЯНИЕ ИГРЫ --------- */
let state = {
    year: 1450,
    pop: 1000,
    food: 500,
    gold: 500,
    iron: 0,
    weapons: 0,
    army: 0,
    popularity: 50,
    castle: 0,

    farms: 0,
    mines: 0,
    markets: 0,
    forges: 0,

    map: [],

    pendingBuild: null,
    pendingAmount: 1
};


/* ============================================================
   === АВТОСОХРАНЕНИЕ ===
============================================================ */

function saveGame() {
    localStorage.setItem("yoniumGame", JSON.stringify(state));
}

function loadGame() {
    const data = localStorage.getItem("yoniumGame");
    if (!data) return;
    try {
        state = JSON.parse(data);
    } catch {
        console.warn("Ошибка чтения сохранения");
    }
}

loadGame();



/* ============================================================
    === МИНИ-КАРТА ===
============================================================ */

const terrainTypes = [
    "terrain-grass",
    "terrain-forest",
    "terrain-water",
    "terrain-road"
];

function generateMap() {
    if (state.map.length > 0) return;

    for (let i = 0; i < 100; i++) {
        state.map.push({
            type: terrainTypes[Math.floor(Math.random() * terrainTypes.length)],
            building: null
        });
    }
}

function renderMap() {
    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";

    state.map.forEach(cell => {
        const div = document.createElement("div");
        div.className = "mapCell " + cell.type;

        if (cell.building) {
            const icon = document.createElement("div");
            icon.className = "mapIcon icon-" + cell.building;
            div.appendChild(icon);
        }

        grid.appendChild(div);
    });
}



/* ============================================================
    === UI UPDATE ===
============================================================ */

function updateUI() {
    document.getElementById("yearLabel").textContent = "Год: " + state.year;

    document.getElementById("pop").textContent = state.pop;
    document.getElementById("food").textContent = state.food;
    document.getElementById("gold").textContent = state.gold;
    document.getElementById("iron").textContent = state.iron;
    document.getElementById("weapons").textContent = state.weapons;
    document.getElementById("army").textContent = state.army;
    document.getElementById("popularity").textContent = state.popularity + "%";
    document.getElementById("castle").textContent = state.castle + " / 8";

    updateRank();
    renderMap();
    saveGame();
}



/* ============================================================
    === ТИТУЛЫ ===
============================================================ */

function updateRank() {
    let rank = "Крестьянин";

    if (state.pop >= 1100 && state.popularity >= 60) rank = "Барон";
    if (state.pop >= 1400 && state.popularity >= 65) rank = "Граф";
    if (state.pop >= 2000 && state.popularity >= 70 && state.castle >= 1 && state.army >= 10) rank = "Герцог";
    if (state.pop >= 3000 && state.popularity >= 75 && state.castle >= 2 && state.army >= 25) rank = "Принц";
    if (state.pop >= 5000 && state.popularity >= 80 && state.castle >= 6 && state.army >= 200 && state.gold >= 100000) rank = "Король";
    if (state.pop >= 10000 && state.popularity >= 90 && state.castle >= 8 && state.army >= 500 && state.gold >= 1000000) rank = "Император";

    document.getElementById("rank").textContent = rank;
}



/* ============================================================
    === POPUP СТРОИТЕЛЬСТВА ===
============================================================ */

const buildingInfo = {
    farm:  { title: "Ферма",  icon: "icon_farm.png",  desc: "+500 еды в год", cost: 100 },
    mine:  { title: "Шахта",  icon: "icon_mine.png",  desc: "+10 железа в год", cost: 200 },
    market:{ title: "Рынок",  icon: "icon_market.png", desc: "Открывает торговлю", cost: 300 },
    forge: { title: "Кузница",icon: "icon_forge.png", desc: "Позволяет ковать оружие", cost: 150 }
};

function openBuildPopup(type) {
    state.pendingBuild = type;

    const data = buildingInfo[type];

    document.getElementById("popupIcon").src = "assets/icons/" + data.icon;
    document.getElementById("popupTitle").textContent = data.title;
    document.getElementById("popupDesc").textContent = data.desc;
    document.getElementById("popupCost").textContent = "Стоимость: " + data.cost + " золота";

    document.getElementById("buildPopup").classList.remove("hidden");
}

function closeBuildPopup() {
    document.getElementById("buildPopup").classList.add("hidden");
}

function confirmBuild() {
    const amount = parseInt(document.getElementById("popupAmount").value);
    const type = state.pendingBuild;

    const cost = buildingInfo[type].cost * amount;

    if (state.gold < cost) return alert("Недостаточно золота!");

    state.gold -= cost;

    for (let i = 0; i < amount; i++) {
        if (type === "farm") state.farms++;
        if (type === "mine") state.mines++;
        if (type === "market") state.markets++;
        if (type === "forge") state.forges++;

        placeBuildingOnMap(type);
    }

    closeBuildPopup();
    updateUI();
}



/* ============================================================
    === КАРТА: РАЗМЕЩЕНИЕ ПОСТРОЕК ===
============================================================ */

function placeBuildingOnMap(type) {
    for (let i = 0; i < 100; i++) {
        if (!state.map[i].building) {
            state.map[i].building = type;
            return;
        }
    }
}



/* ============================================================
    === УЛУЧШЕНИЕ ЗАМКА (без castle1.png / castle2.png) ===
============================================================ */

function upgradeCastle() {
    if (state.castle >= 8) {
        alert("Замок уже полностью построен!");
        return;
    }

    const cost = 500 * (state.castle + 1);

    if (state.gold < cost) {
        alert("Нужно золота: " + cost);
        return;
    }

    state.gold -= cost;
    state.castle++;

    // Эффект без смены изображения
    const img = document.getElementById("castleImage");
    img.classList.add("castle-upgrade");
    setTimeout(() => img.classList.remove("castle-upgrade"), 900);

    updateUI();
}



/* ============================================================
    === АРМИЯ ===
============================================================ */

function craftWeapon() {
    if (state.iron < 1) return alert("Нет железа!");
    state.iron--;
    state.weapons++;
    updateUI();
}

function hireSoldier() {
    if (state.weapons < 1) return alert("Нет оружия!");
    if (state.pop < 201) return alert("Нужно минимум 200 свободных жителей!");

    state.weapons--;
    state.army++;
    state.pop--;

    updateUI();
}



/* ============================================================
    === ТОРГОВЛЯ ===
============================================================ */

function sellFood() {
    if (state.markets < 1) return alert("Нужен рынок!");
    if (state.food < 50) return alert("Мало еды!");

    state.food -= 50;
    state.gold += 50;
    updateUI();
}

function buyFood() {
    if (state.markets < 1) return alert("Нужен рынок!");
    if (state.gold < 50) return alert("Мало золота!");

    state.gold -= 50;
    state.food += 50;
    updateUI();
}

function sellIron() {
    if (state.markets < 5) return alert("Нужно 5 рынков!");
    if (state.iron < 1) return alert("Нет железа!");

    state.iron--;
    state.gold += 120;
    updateUI();
}

function buyIron() {
    if (state.markets < 5) return alert("Нужно 5 рынков!");
    if (state.gold < 120) return alert("Мало золота!");

    state.gold -= 120;
    state.iron++;
    updateUI();
}

function sellWeapons() {
    if (state.markets < 10) return alert("Нужно 10 рынков!");
    if (state.weapons < 1) return alert("Нет оружия!");

    state.weapons--;
    state.gold += 300;
    updateUI();
}

function buyWeapons() {
    if (state.markets < 10) return alert("Нужно 10 рынков!");
    if (state.gold < 300) return alert("Мало золота!");

    state.gold -= 300;
    state.weapons++;
    updateUI();
}



/* ============================================================
    === КОНЕЦ ГОДА ===
============================================================ */

function endTurn() {
    state.year++;

    const taxRate = parseInt(document.getElementById("taxRate").value);
    const foodRate = parseInt(document.getElementById("foodRate").value);

    let log = "Год " + state.year + ":\n\n";

    const taxIncome = Math.floor(state.pop * (taxRate / 100));
    state.gold += taxIncome;
    log += "Налоги: +" + taxIncome + "\n";

    const foodGain = state.farms * 500;
    const ironGain = state.mines * 10;
    state.food += foodGain;
    state.iron += ironGain;

    log += `Фермы: +${foodGain} еды\n`;
    log += `Шахты: +${ironGain} железа\n`;

    const foodNeeded = state.pop * foodRate;
    state.food -= foodNeeded;

    if (state.food < 0) {
        state.popularity -= 15;
        state.pop += Math.floor(state.food / 50);
        state.food = 0;
        log += "ГОЛОД! Популярность сильно упала.\n";
    }

    const growth = Math.floor((state.popularity / 100) * 20);
    state.pop += growth;
    log += `Прирост населения: +${growth}\n`;

    if (taxRate < 20) state.popularity += 2;
    if (taxRate > 50) state.popularity -= 4;

    if (state.popularity < 0) state.popularity = 0;
    if (state.popularity > 100) state.popularity = 100;

    updateUI();

    document.getElementById("reportText").textContent = log;
    document.getElementById("reportPanel").classList.remove("hidden");

    if (state.year >= 1500) {
        alert("Тёмный Император вернулся. Игра начинается заново.");
        localStorage.removeItem("yoniumGame");
        location.reload();
    }
}

function closeReport() {
    document.getElementById("reportPanel").classList.add("hidden");
}



/* ============================================================
    === START ===
============================================================ */

generateMap();
updateUI();
