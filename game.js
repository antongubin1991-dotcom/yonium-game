/* ============================================================
   ИГРОВОЕ СОСТОЯНИЕ
============================================================ */

let state = {
    year: 1450,

    pop: 100,
    food: 500,
    gold: 1000,
    iron: 0,
    weapons: 0,
    army: 0,
    popularity: 50,

    castle: 0,

    farms: 0,
    mines: 0,
    markets: 0,
    forges: 0,

    taxRate: 30,
    foodRate: 3,

    map: []
};


/* ============================================================
   СОХРАНЕНИЕ / ЗАГРУЗКА
============================================================ */

function saveGame() {
    localStorage.setItem("yonium_save", JSON.stringify(state));
}

function loadGame() {
    const s = localStorage.getItem("yonium_save");
    if (s) state = JSON.parse(s);
}


/* ============================================================
   ИНИЦИАЛИЗАЦИЯ МИНИКАРТЫ
============================================================ */

const terrainTypes = ["grass", "forest", "water", "road"];

function initMap() {
    if (state.map.length === 100) return;

    for (let i = 0; i < 100; i++) {
        const type = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        state.map.push({ terrain: type, building: null });
    }
}

function renderMap() {
    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";

    state.map.forEach((cell, i) => {
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


/* ============================================================
   ОТРИСОВКА UI
============================================================ */

function updateUI() {
    document.getElementById("yearLabel").innerText = "Год: " + state.year;

    document.getElementById("pop").innerText = state.pop;
    document.getElementById("food").innerText = state.food;
    document.getElementById("gold").innerText = state.gold;
    document.getElementById("iron").innerText = state.iron;
    document.getElementById("weapons").innerText = state.weapons;
    document.getElementById("army").innerText = state.army;
    document.getElementById("popularity").innerText = state.popularity + "%";
    document.getElementById("castle").innerText = state.castle + "/8";
    document.getElementById("rank").innerText = getRank();

    document.getElementById("taxRate").value = state.taxRate;
    document.getElementById("foodRate").value = state.foodRate;

    updateAdvisor();
    renderMap();
}
/* ============================================================
   СИНХРОНИЗАЦИЯ ИНПУТОВ (налоги / пайки)
============================================================ */

document.getElementById("taxRate").addEventListener("input", () => {
    const v = Number(document.getElementById("taxRate").value);
    state.taxRate = Math.min(100, Math.max(0, v));
});

document.getElementById("foodRate").addEventListener("input", () => {
    const v = Number(document.getElementById("foodRate").value);
    state.foodRate = Math.min(10, Math.max(0, v));
});

/* ============================================================
   РАНГИ
============================================================ */

function getRank() {
    const s = state;
    if (s.pop >= 10000 && s.popularity >= 90 && s.castle >= 8 && s.army >= 500 && s.gold >= 1000000) return "Император";
    if (s.pop >= 5000 && s.popularity >= 80 && s.castle >= 6 && s.army >= 200 && s.gold >= 100000) return "Король";
    if (s.pop >= 3000 && s.popularity >= 75 && s.castle >= 2 && s.army >= 25) return "Принц";
    if (s.pop >= 2000 && s.popularity >= 70 && s.castle >= 1 && s.army >= 10) return "Герцог";
    if (s.pop >= 1400 && s.popularity >= 65) return "Граф";
    if (s.pop >= 1100 && s.popularity >= 60) return "Барон";
    return "Крестьянин";
}


/* ============================================================
   СОВЕТНИК
============================================================ */

function updateAdvisor() {
    const el = document.getElementById("advisor");
    if (!el) return;

    let r = getRank();

    let next = "";
    switch (r) {
        case "Крестьянин": next = "Наберите 1100 жителей и 60% популярности."; break;
        case "Барон": next = "Наберите 1400 жителей и 65% популярности."; break;
        case "Граф": next = "Нужны 2000 жителей, 70% и замок 1 уровня."; break;
        case "Герцог": next = "Нужны 3000 жителей, 75% и замок 2 уровня."; break;
        case "Принц": next = "Нужны 5000 жителей, 80%, замок 6, армия 200."; break;
        case "Король": next = "Нужны 10000 жителей, 90%, замок 8, армия 500."; break;
        default: next = "Вы близки к победе!";
    }

    el.innerText = "Титул: " + r + "\n\n" + next;
}


/* ============================================================
   POPUP ДЛЯ СТРОИТЕЛЬСТВА
============================================================ */

let selectedBuild = null;

const buildInfo = {
    farm:  { name: "Ферма",  cost: 100, icon: "assets/icons/icon_farm.png",  desc: "+500 еды в год" },
    mine:  { name: "Шахта",  cost: 200, icon: "assets/icons/icon_mine.png",  desc: "+10 железа" },
    market:{ name: "Рынок",  cost: 300, icon: "assets/icons/icon_market.png",desc: "Открывает торговлю" },
    forge: { name: "Кузница",cost: 150, icon: "assets/icons/icon_forge.png", desc: "Позволяет ковать оружие" }
};

function openBuildPopup(type) {
    selectedBuild = type;

    const info = buildInfo[type];
    document.getElementById("buildTitle").innerText = info.name;
    document.getElementById("buildIcon").src = info.icon;
    document.getElementById("buildDesc").innerText = info.desc + "\nЦена: " + info.cost + " золота";

    document.getElementById("buildAmount").value = 1;

    document.getElementById("buildPopup").classList.remove("hidden");
}

function closeBuildPopup() {
    document.getElementById("buildPopup").classList.add("hidden");
}

function confirmBuild() {
    const amount = Number(document.getElementById("buildAmount").value);
    const info = buildInfo[selectedBuild];

    const totalCost = info.cost * amount;

    if (state.gold < totalCost) {
        alert("Недостаточно золота!");
        return;
    }

    state.gold -= totalCost;

    for (let i = 0; i < amount; i++) {
        placeBuildingOnMap(selectedBuild);
    }

    if (selectedBuild === "farm") state.farms += amount;
    if (selectedBuild === "mine") state.mines += amount;
    if (selectedBuild === "market") state.markets += amount;
    if (selectedBuild === "forge") state.forges += amount;

    closeBuildPopup();
    updateUI();
}


/* ============================================================
   РАЗМЕЩЕНИЕ НА МИНИКАРТЕ
============================================================ */

function placeBuildingOnMap(type) {
    for (let i = 0; i < state.map.length; i++) {
        if (!state.map[i].building) {
            state.map[i].building = type;
            return;
        }
    }
}


/* ============================================================
   ЗАМОК
============================================================ */

function upgradeCastle() {
    if (state.castle >= 8) return alert("Замок уже полностью построен!");
    if (state.gold < 500) return alert("Нужно 500 золота!");

    state.gold -= 500;
    state.castle++;

    updateUI();
}


/* ============================================================
   АРМИЯ
============================================================ */

function craftWeapon() {
    if (state.iron < 1) return alert("Нет железа!");
    state.iron--;
    state.weapons++;
    updateUI();
}

function hireSoldier() {
    if (state.weapons < 1) return alert("Нет оружия!");
    if (state.pop < 1) return alert("Нет жителей!");

    state.weapons--;
    state.pop--;
    state.army++;

    updateUI();
}


/* ============================================================
   ТОРГОВЛЯ
============================================================ */

function sellFood()  { if (state.food > 0) { state.food--; state.gold += 2; } updateUI(); }
function buyFood()   { if (state.gold > 1) { state.food++; state.gold -= 2; } updateUI(); }

function sellIron()  { if (state.iron > 0) { state.iron--; state.gold += 6; } updateUI(); }
function buyIron()   { if (state.gold >= 6) { state.iron++; state.gold -= 6; } updateUI(); }

function sellWeapons() { if (state.weapons > 0) { state.weapons--; state.gold += 10; } updateUI(); }
function buyWeapons()  { if (state.gold >= 10) { state.weapons++; state.gold -= 10; } updateUI(); }


/* ============================================================
   ХОД ГОДА
============================================================ */

function endTurn() {
    let report = "";

    /* =============================
       ОСНОВНАЯ ЭКОНОМИКА
    ============================== */

    // доходы
    let taxIncome = Math.floor(state.pop * (state.taxRate / 100));
    state.gold += taxIncome;
    report += "Налоги: +" + taxIncome + " золота\n";

    // фермы
    let foodGain = state.farms * 500;
    state.food += foodGain;
    report += "Фермы: +" + foodGain + " еды\n";

    // шахты
    let ironGain = state.mines * 10;
    state.iron += ironGain;
    report += "Шахты: +" + ironGain + " железа\n";

    // расход еды
    let foodNeed = state.pop * state.foodRate;
    state.food -= foodNeed;
    report += "Потребление еды: -" + foodNeed + "\n";

    if (state.food < 0) {
        state.food = 0;
        state.popularity -= 10;
        report += "Голод! Популярность -10\n";
    } else {
        state.popularity += 2;
    }

    // прирост населения
    if (state.popularity > 50) {
        let growth = Math.floor(state.pop * 0.03);
        state.pop += growth;
        report += "Рождаемость: +" + growth + " жителей\n";
    }


    /* =============================
       СЛУЧАЙНЫЕ СОБЫТИЯ
    ============================== */

    // 1) Разбойники (10%)
    if (Math.random() < 0.10) {
        if (state.army > 50) {
            state.popularity += 5;
            report += "Разбойники напали, но армия их отбила! Популярность +5\n";
        } else {
            let stolen = Math.floor(state.food * 0.2);
            state.food -= stolen;
            state.popularity -= 8;
            report += "Разбойники ограбили деревню! Потеряно " + stolen + " еды, популярность -8\n";
        }
    }

    // 2) Эпидемия (5%)
    if (Math.random() < 0.05) {
        let death = Math.floor(state.pop * 0.07);
        state.pop -= death;
        state.popularity -= 5;
        report += "Эпидемия Забвения унесла " + death + " жителей. Популярность -5\n";
    }

    // 3) Пожар (3%)
    if (Math.random() < 0.03) {
        if (state.farms > 0) {
            state.farms--;
            report += "Пожар уничтожил одну ферму!\n";
        } else if (state.markets > 0) {
            state.markets--;
            report += "Пожар уничтожил один рынок!\n";
        }
    }

    // 4) Мистическое событие (3%)
    if (Math.random() < 0.03) {
        if (Math.random() < 0.5) {
            state.popularity += 10;
            report += "Странствующий мудрец благословил ваш народ. Популярность +10\n";
        } else {
            state.popularity -= 15;
            report += "Темный дух посетил ваши земли... Популярность -15\n";
        }
    }

    // 5) Экономическое чудо (4%)
    if (Math.random() < 0.04) {
        let bonus = Math.floor(50 + Math.random() * 150);
        state.gold += bonus;
        report += "Богатый купец пожертвовал вам " + bonus + " золота\n";
    }

    // 6) Миграция (прибытие / уход)
    if (state.popularity > 70) {
        let migrants = Math.floor(state.pop * 0.05);
        state.pop += migrants;
        report += "В империю прибыли " + migrants + " переселенцев.\n";
    }

    if (state.popularity < 30) {
        let flee = Math.floor(state.pop * 0.03);
        state.pop -= flee;
        report += "Часть жителей покинула империю (" + flee + ").\n";
    }

    // 7) Проклятие Тёмного Императора — каждые 10 лет
    if (state.year % 10 === 0) {
        state.popularity -= 10;
        report += "Тёмный Император насылает проклятие! Популярность -10\n";
    }


    /* =============================
       ФИНАЛ ГОДА
    ============================== */

    state.year++;

    // Добавляем ранг в отчёт
    report += "\nТекущий титул: " + getRank() + "\n";

    // показать отчёт
    document.getElementById("reportText").innerText = report;
    document.getElementById("reportPanel").classList.remove("hidden");

    updateUI();
    saveGame();
}

/* ============================================================
   СТАРТ ИГРЫ
============================================================ */

loadGame();
initMap();
updateUI();
renderMap();


