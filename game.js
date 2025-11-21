/* ============================================================
   СОСТОЯНИЕ ИГРЫ
============================================================ */

let game = {
    year: 1450,

    population: 1000,
    food: 5000,
    gold: 500,
    iron: 0,
    weapons: 0,
    army: 0,
    popularity: 60,

    farms: 1,
    mines: 0,
    markets: 0,
    forges: 0,
    castleLevel: 0,

    taxRate: 30,
    foodRate: 3
};

// Ранги как в описании (упрощённая интерпретация)
const RANKS = [
    { title: "Без титула", pop: 0,    popularity: 0,  castle: 0, army: 0,   gold: 0 },
    { title: "Барон",      pop: 1100, popularity: 60, castle: 0, army: 0,   gold: 0 },
    { title: "Граф",       pop: 1400, popularity: 65, castle: 0, army: 0,   gold: 0 },
    { title: "Герцог",     pop: 2000, popularity: 70, castle: 1, army: 10,  gold: 0 },
    { title: "Принц",      pop: 3000, popularity: 75, castle: 2, army: 25,  gold: 0 },
    { title: "Король",     pop: 5000, popularity: 80, castle: 6, army: 200, gold: 100000 },
    { title: "Император",  pop: 10000,popularity: 90, castle: 8, army: 500, gold: 1000000 }
];

/* ============================================================
   СОХРАНЕНИЕ / ЗАГРУЗКА
============================================================ */

function saveGame() {
    try {
        localStorage.setItem("imperiya_tmy_save", JSON.stringify(game));
    } catch (e) {
        console.warn("Не удалось сохранить игру:", e);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem("imperiya_tmy_save");
        if (!raw) return;
        const data = JSON.parse(raw);
        // Аккуратно обновляем только известные поля
        Object.keys(game).forEach(key => {
            if (key in data) {
                game[key] = data[key];
            }
        });
    } catch (e) {
        console.warn("Не удалось загрузить сохранение:", e);
    }
}

/* ============================================================
   МИНИ-КАРТА
============================================================ */

const MAP_SIZE = 12;
const TERRAIN_CLASSES = ["terrain-grass", "terrain-forest", "terrain-water", "terrain-road"];

function initMap() {
    const grid = document.getElementById("mapGrid");
    if (!grid) return;

    grid.innerHTML = "";

    for (let i = 0; i < MAP_SIZE * MAP_SIZE; i++) {
        const cell = document.createElement("div");
        cell.classList.add("mapCell");

        const t = TERRAIN_CLASSES[Math.floor(Math.random() * TERRAIN_CLASSES.length)];
        cell.classList.add(t);

        grid.appendChild(cell);
    }

    // Отрисуем уже существующие здания по факту их количества
    for (let i = 0; i < game.farms; i++) placeBuildingIcon("icon-farm");
    for (let i = 0; i < game.mines; i++) placeBuildingIcon("icon-mine");
    for (let i = 0; i < game.markets; i++) placeBuildingIcon("icon-market");
    for (let i = 0; i < game.forges; i++) placeBuildingIcon("icon-forge");
    for (let i = 0; i < game.castleLevel; i++) placeBuildingIcon("icon-castle");
}

function placeBuildingIcon(iconClass) {
    const grid = document.getElementById("mapGrid");
    if (!grid) return;
    const cells = grid.children;
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        // первая клетка без иконки
        if (!cell.querySelector(".mapIcon")) {
            const icon = document.createElement("div");
            icon.classList.add("mapIcon", iconClass);
            cell.appendChild(icon);
            break;
        }
    }
}

/* ============================================================
   РАНГ
============================================================ */

function getRank() {
    let current = RANKS[0].title;
    for (const r of RANKS) {
        if (
            game.population >= r.pop &&
            game.popularity >= r.popularity &&
            game.castleLevel >= r.castle &&
            game.army >= r.army &&
            game.gold >= r.gold
        ) {
            current = r.title;
        }
    }
    return current;
}

/* ============================================================
   ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
============================================================ */

function updateUI() {
    const yearLabel = document.getElementById("yearLabel");
    if (yearLabel) yearLabel.innerText = "Год: " + game.year;

    setText("pop", game.population);
    setText("food", game.food);
    setText("gold", game.gold);
    setText("iron", game.iron);
    setText("weapons", game.weapons);
    setText("army", game.army);
    setText("popularity", game.popularity + "%");
    setText("castle", game.castleLevel + " / 8");
    setText("rank", getRank());

    const taxInput = document.getElementById("taxRate");
    if (taxInput) taxInput.value = game.taxRate;

    const foodInput = document.getElementById("foodRate");
    if (foodInput) foodInput.value = game.foodRate;

    updateAdvisor();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function updateAdvisor() {
    const adv = document.getElementById("advisorText");
    if (!adv) return;

    const rank = getRank();
    let msg = "";

    if (rank === "Император") {
        msg = "Вы стали Императором! Темный Император более не вернётся.";
    } else if (game.population < 1100) {
        msg = "Нам нужно увеличить население. Поддерживайте высокую популярность и достаточный рацион.";
    } else if (game.castleLevel < 1) {
        msg = "Постройте замок — это укрепит вашу власть.";
    } else if (game.army < 50) {
        msg = "Увеличьте армию, чтобы защититься от угроз.";
    } else if (game.gold < 10000) {
        msg = "Развивайте рынки и собирайте золото.";
    } else {
        msg = "Вы на верном пути, мой правитель.";
    }

    adv.innerText = msg;
}

/* ============================================================
   ПОПАП ДЛЯ СТРОИТЕЛЬСТВА
============================================================ */

let pendingBuildType = null;

function openBuildPopup(type, title, costText, iconPath) {
    pendingBuildType = type;

    const popup = document.getElementById("popup");
    const icon = document.getElementById("popupIcon");
    const titleEl = document.getElementById("popupTitle");
    const costEl = document.getElementById("popupCost");

    if (icon) icon.src = iconPath || "";
    if (titleEl) titleEl.innerText = title;
    if (costEl) costEl.innerText = costText;

    if (popup) {
        popup.classList.remove("hidden");
        popup.style.display = "flex";
    }
}

function closePopup() {
    const popup = document.getElementById("popup");
    if (popup) {
        popup.style.display = "none";
        popup.classList.add("hidden");
    }
    pendingBuildType = null;
}

function confirmPopup() {
    if (!pendingBuildType) {
        closePopup();
        return;
    }
    actuallyBuild(pendingBuildType);
    pendingBuildType = null;
    closePopup();
}

/* ============================================================
   СТРОИТЕЛЬСТВО
============================================================ */

function build(type) {
    // только открываем попап, само строительство — в confirmPopup
    switch (type) {
        case "farm":
            openBuildPopup(
                "farm",
                "Ферма",
                "Цена: 100 золота. Производит ~500 еды в год.",
                "assets/icons/icon_farm.png"
            );
            break;
        case "mine":
            openBuildPopup(
                "mine",
                "Шахта",
                "Цена: 200 золота. Добывает ~10 железа в год.",
                "assets/icons/icon_mine.png"
            );
            break;
        case "market":
            openBuildPopup(
                "market",
                "Рынок",
                "Цена: 300 золота. Открывает торговлю и увеличивает приток золота.",
                "assets/icons/icon_market.png"
            );
            break;
        case "forge":
            openBuildPopup(
                "forge",
                "Кузница",
                "Цена: 150 золота. Позволяет ковать оружие из железа.",
                "assets/icons/icon_forge.png"
            );
            break;
    }
}

function actuallyBuild(type) {
    switch (type) {
        case "farm":
            if (game.gold < 100) {
                alert("Недостаточно золота для фермы.");
                return;
            }
            game.gold -= 100;
            game.farms++;
            placeBuildingIcon("icon-farm");
            break;

        case "mine":
            if (game.gold < 200) {
                alert("Недостаточно золота для шахты.");
                return;
            }
            game.gold -= 200;
            game.mines++;
            placeBuildingIcon("icon-mine");
            break;

        case "market":
            if (game.gold < 300) {
                alert("Недостаточно золота для рынка.");
                return;
            }
            game.gold -= 300;
            game.markets++;
            placeBuildingIcon("icon-market");
            break;

        case "forge":
            if (game.gold < 150) {
                alert("Недостаточно золота для кузницы.");
                return;
            }
            game.gold -= 150;
            game.forges++;
            placeBuildingIcon("icon-forge");
            break;
    }

    updateUI();
    saveGame();
}

function upgradeCastle() {
    if (game.castleLevel >= 8) {
        alert("Замок уже максимального уровня.");
        return;
    }
    if (game.gold < 500) {
        alert("Недостаточно золота для улучшения замка.");
        return;
    }
    game.gold -= 500;
    game.castleLevel++;
    placeBuildingIcon("icon-castle");
    updateUI();
    saveGame();
}

/* ============================================================
   АРМИЯ
============================================================ */

function craftWeapon() {
    if (game.forges <= 0) {
        alert("Нужна хотя бы одна кузница.");
        return;
    }
    if (game.iron < 1) {
        alert("Недостаточно железа.");
        return;
    }
    game.iron -= 1;
    game.weapons += 1;
    updateUI();
    saveGame();
}

function hireSoldier() {
    if (game.weapons < 1) {
        alert("Нужны оружие для найма солдата.");
        return;
    }
    if (game.population <= 200) {
        alert("Нужно хотя бы 200 свободных жителей.");
        return;
    }
    game.weapons -= 1;
    game.population -= 1;
    game.army += 1;
    updateUI();
    saveGame();
}

/* ============================================================
   ТОРГОВЛЯ
============================================================ */

function sellFood() {
    if (game.markets < 1) {
        alert("Нужно построить рынок.");
        return;
    }
    if (game.food < 100) {
        alert("Недостаточно еды для продажи.");
        return;
    }
    game.food -= 100;
    // цена зависит от урожая опционально, пока фиксированно
    game.gold += 50;
    updateUI();
    saveGame();
}

function buyFood() {
    if (game.markets < 1) {
        alert("Нужно построить рынок.");
        return;
    }
    if (game.gold < 60) {
        alert("Недостаточно золота для покупки еды.");
        return;
    }
    game.gold -= 60;
    game.food += 100;
    updateUI();
    saveGame();
}

function sellIron() {
    if (game.markets < 5) {
        alert("Нужно минимум 5 рынков для торговли железом.");
        return;
    }
    if (game.iron < 5) {
        alert("Недостаточно железа.");
        return;
    }
    game.iron -= 5;
    game.gold += 200;
    updateUI();
    saveGame();
}

function buyIron() {
    if (game.markets < 5) {
        alert("Нужно минимум 5 рынков для торговли железом.");
        return;
    }
    if (game.gold < 150) {
        alert("Недостаточно золота.");
        return;
    }
    game.gold -= 150;
    game.iron += 5;
    updateUI();
    saveGame();
}

function sellWeapons() {
    if (game.markets < 10) {
        alert("Нужно минимум 10 рынков для торговли оружием.");
        return;
    }
    if (game.weapons < 2) {
        alert("Недостаточно оружия.");
        return;
    }
    game.weapons -= 2;
    game.gold += 300;
    updateUI();
    saveGame();
}

function buyWeapons() {
    if (game.markets < 10) {
        alert("Нужно минимум 10 рынков для торговли оружием.");
        return;
    }
    if (game.gold < 250) {
        alert("Недостаточно золота.");
        return;
    }
    game.gold -= 250;
    game.weapons += 2;
    updateUI();
    saveGame();
}

/* ============================================================
   ЗАВЕРШЕНИЕ ГОДА
============================================================ */

function endTurn() {
    let report = "";

    // Налоги
    const taxIncome = Math.floor(game.population * (game.taxRate / 100));
    game.gold += taxIncome;
    report += "Налоги: +" + taxIncome + " золота\n";

    // Производство
    const foodGain = game.farms * 500;
    const ironGain = game.mines * 10;
    game.food += foodGain;
    game.iron += ironGain;

    report += "Фермы: +" + foodGain + " еды\n";
    report += "Шахты: +" + ironGain + " железа\n";

    // Потребление еды
    const foodNeed = game.population * game.foodRate;
    game.food -= foodNeed;
    report += "Потребление еды: -" + foodNeed + "\n";

    if (game.food < 0) {
        // голод
        game.food = 0;
        const deaths = Math.floor(game.population * 0.05);
        game.population -= deaths;
        game.popularity -= 10;
        report += "Голод! Умерло " + deaths + " жителей. Популярность -10\n";
    } else {
        // сытые → +популярность
        game.popularity += 2;
        report += "Народ сыт. Популярность +2\n";
    }

    // Рост населения
    let growth = 0;
    if (game.popularity > 50 && game.food > 0) {
        growth = Math.floor(game.population * 0.03);
        game.population += growth;
        report += "Рождаемость: +" + growth + " жителей\n";
    }

    // Клип по популярности
    if (game.popularity > 100) game.popularity = 100;
    if (game.popularity < 0) game.popularity = 0;

    // Переход года
    game.year++;

    // Итог
    report += "\nНаселение: " + game.population +
              "\nПопулярность: " + game.popularity + "%" +
              "\nТитул: " + getRank() + "\n";

    const reportPanel = document.getElementById("reportPanel");
    const reportText = document.getElementById("reportText");
    if (reportText) reportText.innerText = report;
    if (reportPanel) {
        reportPanel.classList.remove("hidden");
        reportPanel.style.display = "flex";
    }

    updateUI();
    saveGame();
}

function closeReport() {
    const reportPanel = document.getElementById("reportPanel");
    if (reportPanel) {
        reportPanel.style.display = "none";
        reportPanel.classList.add("hidden");
    }
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
============================================================ */

function initGame() {
    loadGame();
    initMap();
    updateUI();

    const taxInput = document.getElementById("taxRate");
    if (taxInput) {
        taxInput.addEventListener("input", () => {
            let v = parseInt(taxInput.value, 10);
            if (isNaN(v)) v = 0;
            if (v < 0) v = 0;
            if (v > 100) v = 100;
            game.taxRate = v;
        });
    }

    const foodInput = document.getElementById("foodRate");
    if (foodInput) {
        foodInput.addEventListener("input", () => {
            let v = parseInt(foodInput.value, 10);
            if (isNaN(v)) v = 0;
            if (v < 0) v = 0;
            if (v > 10) v = 10;
            game.foodRate = v;
        });
    }
}

// Скрипт подключен внизу body, DOM уже есть
initGame();
