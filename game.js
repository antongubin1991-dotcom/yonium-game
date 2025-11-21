// ======================================================
//                НАЧАЛЬНЫЕ ДАННЫЕ ИГРЫ
// ======================================================

const STORAGE_KEY = "yonium_game_state";
const terrainTypes = {
    grass: "terrain-grass",
    forest: "terrain-forest",
    water: "terrain-water",
    road: "terrain-road"
};
function createInitialGameState() {
    return {
        year: 1450,

        population: 1000,
        food: 500,
        gold: 500,
        iron: 0,
        weapons: 0,
        army: 0,

        farms: 0,
        mines: 0,
        markets: 0,
        forges: 0,

        popularity: 50,   // 0–100
        taxRate: 30,      // %
        foodRate: 3,      // порций на человека

        castleLevel: 0,
        castleProgress: 0,

        rankIndex: 0,
        lastReport: ""
    };
}

let game = null;

// ======================================================
//                      ТИТУЛЫ
// ======================================================

const ranks = [
    { name: "Барон",     pop: 1100,  popu: 60, castle: 0, army: 0,    gold: 0 },
    { name: "Граф",      pop: 1400,  popu: 65, castle: 0, army: 0,    gold: 0 },
    { name: "Герцог",    pop: 2000,  popu: 70, castle: 1, army: 10,   gold: 0 },
    { name: "Принц",     pop: 3000,  popu: 75, castle: 2, army: 25,   gold: 0 },
    { name: "Король",    pop: 5000,  popu: 80, castle: 6, army: 200,  gold: 100000 },
    { name: "Император", pop: 10000, popu: 90, castle: 8, army: 500,  gold: 1000000 }
];

// ======================================================
//                 ЗАГРУЗКА / СОХРАНЕНИЕ
// ======================================================

function loadGame() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        // минимальная проверка
        if (typeof obj.year !== "number") return null;
        return obj;
    } catch (e) {
        return null;
    }
}

function saveGame() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch (e) {
        console.warn("Не удалось сохранить игру:", e);
    }
}

// ======================================================
//                    ОБНОВЛЕНИЕ РАНГА
// ======================================================

function updateRank() {
    for (let i = ranks.length - 1; i >= 0; i--) {
        const r = ranks[i];
        if (
            game.population >= r.pop &&
            game.popularity >= r.popu &&
            game.castleLevel >= r.castle &&
            game.army >= r.army &&
            game.gold >= r.gold
        ) {
            game.rankIndex = i;
            break;
        }
    }
}

// ======================================================
//                      ОБНОВЛЕНИЕ UI
// ======================================================

function updateUI() {
    if (!game) return;

    // Год
    const yearLabel = document.getElementById("yearLabel");
    if (yearLabel) {
        yearLabel.textContent = "Год: " + game.year;
    }

    // Статистика
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText("pop", game.population);
    setText("food", game.food);
    setText("gold", game.gold.toLocaleString());
    setText("iron", game.iron);
    setText("weapons", game.weapons);
    setText("army", game.army);
    setText("popularity", game.popularity + "%");
    setText("castle", game.castleLevel + " / 8");
    setText("rank", ranks[game.rankIndex].name);

    // Инпуты налогов и еды
    const taxInput = document.getElementById("taxRate");
    const foodInput = document.getElementById("foodRate");
    if (taxInput) taxInput.value = game.taxRate;
    if (foodInput) foodInput.value = game.foodRate;

    updateAdvisor();
    updateCastleImage();
    updateMiniMap();
}

// ======================================================
//                    КАРТИНКА ЗАМКА
// ======================================================

function updateCastleImage() {
    const img = document.getElementById("castleImage");
    if (!img) return;
    // Можно сделать набор картинок castle0.png...castle8.png
    img.src = `assets/castle${game.castleLevel}.png`;
}

// ======================================================
//                     МИНИ-КАРТА
// ======================================================

function updateMiniMap() {
    const map = document.getElementById("mapGrid");
    if (!map) return;

    map.innerHTML = "";

    const size = 10;        // 10×10
    const cells = [];

    // === 1. Генерация ландшафта ===
    for (let i = 0; i < size * size; i++) {
        let r = Math.random();
        let type;

        if (r < 0.10) type = terrainTypes.water;        // 10% вода
        else if (r < 0.40) type = terrainTypes.forest;  // 30% лес
        else type = terrainTypes.grass;                 // 60% трава

        cells.push({ terrain: type, building: null });
    }

    // === 2. Генерация дорог в стиле Diablo: диагональные + хаотичные ===
    for (let y = 0; y < size; y++) {
        let index = y * size + Math.floor(size * 0.5) + (Math.random() > 0.5 ? 1 : -1);
        if (cells[index]) cells[index].terrain = terrainTypes.road;
    }

    // === 3. Размещение зданий ===
    function place(count, cls) {
        for (let i = 0; i < count; i++) {
            let pos = Math.floor(Math.random() * size * size);
            let attempts = 0;

            while (cells[pos].building !== null && attempts < 40) {
                pos = Math.floor(Math.random() * size * size);
                attempts++;
            }

            cells[pos].building = cls;
        }
    }

    place(game.farms, "icon-farm");
    place(game.mines, "icon-mine");
    place(game.markets, "icon-market");
    place(game.forges, "icon-forge");

    // === 4. Замок по центру ===
    const castlePos = 55;
    cells[castlePos].building = "icon-castle";

    // === 5. Рендер ===
    cells.forEach(c => {
        const cell = document.createElement("div");
        cell.classList.add("mapCell", c.terrain);

        if (c.building) {
            const icon = document.createElement("div");
            icon.classList.add("mapIcon", c.building);
            cell.appendChild(icon);
        }

        map.appendChild(cell);
    });
}

// ======================================================
//                        СОВЕТНИК
// ======================================================

function updateAdvisor() {
    const el = document.getElementById("advisor");
    if (!el) return;

    const needRank = ranks[Math.min(game.rankIndex + 1, ranks.length - 1)];
    let msg = "";

    msg += `Текущий титул: ${ranks[game.rankIndex].name}\n`;
    if (game.rankIndex < ranks.length - 1) {
        msg += `Следующий титул: ${needRank.name}\n\n`;
        msg += "Условия повышения:\n";
        msg += `Жители: ${game.population}/${needRank.pop}\n`;
        msg += `Популярность: ${game.popularity}/${needRank.popu}\n`;
        msg += `Замок: ${game.castleLevel}/${needRank.castle}\n`;
        msg += `Солдаты: ${game.army}/${needRank.army}\n`;
        msg += `Золото: ${game.gold}/${needRank.gold}\n`;
    } else {
        msg += "\nВы достигли высшего титула — Император.\nСдерживайте Тёмного Императора до 1500 года!";
    }

    el.textContent = msg;
}

// ======================================================
//                      СТРОИТЕЛЬСТВО
// ======================================================

function build(type) {
    if (type === "farm") {
        if (game.gold < 100) return alert("Недостаточно золота для фермы.");
        game.gold -= 100;
        game.farms++;
    } else if (type === "mine") {
        if (game.gold < 200) return alert("Недостаточно золота для шахты.");
        game.gold -= 200;
        game.mines++;
    } else if (type === "market") {
        if (game.gold < 300) return alert("Недостаточно золота для рынка.");
        game.gold -= 300;
        game.markets++;
    } else if (type === "forge") {
        if (game.gold < 150) return alert("Недостаточно золота для кузницы.");
        game.gold -= 150;
        game.forges++;
    }

    saveGame();
    updateUI();
}

function upgradeCastle() {
    if (game.castleLevel >= 8) {
        alert("Замок уже полностью построен.");
        return;
    }

    // каждая постройка уровня — 1 год работ
    game.castleProgress++;
    if (game.castleProgress >= 1) {
        game.castleProgress = 0;
        game.castleLevel++;

        const img = document.getElementById("castleImage");
        if (img) {
            img.classList.add("castle-upgrade");
            setTimeout(() => img.classList.remove("castle-upgrade"), 900);
        }
    }

    saveGame();
    updateUI();
}

// ======================================================
//                          АРМИЯ
// ======================================================

function craftWeapon() {
    if (game.iron < 1) return alert("Недостаточно железа.");
    game.iron--;
    game.weapons++;
    saveGame();
    updateUI();
}

function hireSoldier() {
    if (game.weapons < 1) return alert("Нет оружия.");
    if (game.population <= 200) return alert("Нельзя забирать последних жителей — минимум 200 должно оставаться.");

    game.weapons--;
    game.population--;
    game.army++;

    saveGame();
    updateUI();
}

// ======================================================
//                         ТОРГОВЛЯ
// ======================================================

function sellFood() {
    if (game.markets < 1) return alert("Нужен хотя бы 1 рынок.");
    if (game.food < 100) return alert("Недостаточно еды для продажи.");

    const pricePer100 = 50; // условная цена
    game.food -= 100;
    game.gold += pricePer100;
    saveGame();
    updateUI();
}

function buyFood() {
    if (game.markets < 1) return alert("Нужен хотя бы 1 рынок.");
    const pricePer100 = 60;
    if (game.gold < pricePer100) return alert("Недостаточно золота.");

    game.gold -= pricePer100;
    game.food += 100;
    saveGame();
    updateUI();
}

function sellIron() {
    if (game.markets < 5) return alert("Нужно минимум 5 рынков для торговли железом.");
    if (game.iron < 10) return alert("Недостаточно железа (нужно 10).");

    const pricePer10 = 80;
    game.iron -= 10;
    game.gold += pricePer10;
    saveGame();
    updateUI();
}

function buyIron() {
    if (game.markets < 5) return alert("Нужно минимум 5 рынков для торговли железом.");
    const pricePer10 = 100;
    if (game.gold < pricePer10) return alert("Недостаточно золота.");

    game.gold -= pricePer10;
    game.iron += 10;
    saveGame();
    updateUI();
}

function sellWeapons() {
    if (game.markets < 10) return alert("Нужно минимум 10 рынков для торговли оружием.");
    if (game.weapons < 5) return alert("Недостаточно оружия (нужно 5).");

    const pricePer5 = 200;
    game.weapons -= 5;
    game.gold += pricePer5;
    saveGame();
    updateUI();
}

function buyWeapons() {
    if (game.markets < 10) return alert("Нужно минимум 10 рынков для торговли оружием.");
    const pricePer5 = 250;
    if (game.gold < pricePer5) return alert("Недостаточно золота.");

    game.gold -= pricePer5;
    game.weapons += 5;
    saveGame();
    updateUI();
}

// ======================================================
//                      КОНЕЦ ГОДА
// ======================================================

function endTurn() {
    // Обновляем параметры налогов/еды с инпутов
    const taxInput = document.getElementById("taxRate");
    const foodInput = document.getElementById("foodRate");
    if (taxInput) game.taxRate = Math.max(0, Math.min(100, Number(taxInput.value) || 0));
    if (foodInput) game.foodRate = Math.max(0, Math.min(10, Number(foodInput.value) || 0));

    let report = `Год ${game.year} → ${game.year + 1}\n\n`;

    // Производство
    const foodProduced = game.farms * 500;
    const ironProduced = game.mines * 10;

    game.food += foodProduced;
    game.iron += ironProduced;

    report += `Произведено еды: +${foodProduced}\n`;
    report += `Добыто железа: +${ironProduced}\n`;

    // Потребление еды
    const foodNeed = Math.floor(game.population * game.foodRate);
    if (foodNeed > 0) {
        if (game.food >= foodNeed) {
            game.food -= foodNeed;
            report += `Съедено еды: ${foodNeed}\n`;
            game.popularity += 2;
            // прирост населения
            const growth = Math.floor(game.population * 0.03);
            game.population += growth;
            report += `Рождение и иммиграция: +${growth} жителей\n`;
        } else {
            report += `Еды не хватило! Не хватило ${foodNeed - game.food} порций.\n`;
            game.food = 0;
            game.popularity -= 5;
            const loss = Math.floor(game.population * 0.05);
            game.population = Math.max(0, game.population - loss);
            report += `Голод и миграция: -${loss} жителей\n`;
        }
    }

    // Налоги
    const taxIncome = Math.floor(game.population * (game.taxRate / 100));
    game.gold += taxIncome;
    report += `Налоги: +${taxIncome} золота\n`;

    // Популярность от налогов
    if (game.taxRate <= 20) game.popularity += 2;
    else if (game.taxRate >= 50) game.popularity -= 3;

    // Ограничения
    if (game.popularity < 0) game.popularity = 0;
    if (game.popularity > 100) game.popularity = 100;

    // Обновляем титул
    updateRank();

    // Переход года
    game.year++;

    // Проверка победы/поражения
    const currentRank = ranks[game.rankIndex].name;
    if (
        currentRank === "Император" &&
        game.population >= 10000 &&
        game.popularity >= 90 &&
        game.castleLevel >= 8 &&
        game.army >= 500 &&
        game.gold >= 1000000
    ) {
        report += `\nВы стали Императором и выполнили условия победы!`;
        game.lastReport = report;
        saveGame();
        updateUI();
        showReport(report);
        setTimeout(() => {
            alert("🎉 Победа! Вы стали Императором.");
            resetGame();
        }, 100);
        return;
    }

    if (game.year >= 1500 && currentRank !== "Император") {
        report += `\nТёмный Император вернулся... Вы не успели занять трон.`;
        game.lastReport = report;
        saveGame();
        updateUI();
        showReport(report);
        setTimeout(() => {
            alert("💀 Поражение. Вы не успели стать Императором.");
            resetGame();
        }, 100);
        return;
    }

    game.lastReport = report;
    saveGame();
    updateUI();
    showReport(report);
}

// ======================================================
//                     ОТЧЁТ ЗА ГОД
// ======================================================

function showReport(text) {
    const panel = document.getElementById("reportPanel");
    const textEl = document.getElementById("reportText");
    if (!panel || !textEl) return;
    textEl.textContent = text;
    panel.classList.remove("hidden");
}

function closeReport() {
    const panel = document.getElementById("reportPanel");
    if (!panel) return;
    panel.classList.add("hidden");
}

// ======================================================
//                      СБРОС ИГРЫ
// ======================================================

function resetGame() {
    game = createInitialGameState();
    saveGame();
    updateUI();
}

// ======================================================
//                         СТАРТ
// ======================================================

(function init() {
    game = loadGame() || createInitialGameState();
    updateRank();
    updateUI();
})();

