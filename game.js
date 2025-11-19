/* ============================================================
   ДАННЫЕ ИГРЫ + МЕТА-ПРОГРЕСС
============================================================ */

// Загружаем игру и мета-данные
let game = JSON.parse(localStorage.getItem("gameData")) || null;

let meta = JSON.parse(localStorage.getItem("metaProgress")) || {
    completedRuns: 0,
    bonusFood: 0,
    bonusGold: 0,
    bonusPopulation: 0
};

// Если игры нет — создаём новую
if (!game) restartGame();


/* ============================================================
   СОХРАНЕНИЕ
============================================================ */

function saveGame() {
    localStorage.setItem("gameData", JSON.stringify(game));
}

function saveMeta() {
    localStorage.setItem("metaProgress", JSON.stringify(meta));
}


/* ============================================================
   СОЗДАНИЕ НОВОЙ ИГРЫ
============================================================ */

function restartGame() {

    game = {
        year: 1450,

        population: 500 + meta.bonusPopulation,
        food: 2000 + meta.bonusFood,
        gold: 1000 + meta.bonusGold,

        iron: 0,
        weapons: 0,
        army: 0,

        popularity: 50,

        farms: 0,
        mines: 0,
        markets: 0,
        forges: 0,

        castleLevel: 0,
        castleProgress: 0,

        lastReport: "",
    };

    saveGame();
    updateUI();
}


/* ============================================================
   ОБНОВЛЕНИЕ UI
============================================================ */

function updateUI() {

    document.getElementById("year").textContent = game.year;

    document.getElementById("statPopulation").textContent = game.population;
    document.getElementById("statFood").textContent = game.food;
    document.getElementById("statGold").textContent = game.gold;
    document.getElementById("statIron").textContent = game.iron;
    document.getElementById("statWeapons").textContent = game.weapons;
    document.getElementById("statArmy").textContent = game.army;
    document.getElementById("statPopularity").textContent = game.popularity;

    document.getElementById("statCastle").textContent =
        game.castleLevel + " / 8";

    updateCastleView();
    updateMiniMap();
}


/* ============================================================
   ЗАМКОВОЕ ИЗОБРАЖЕНИЕ (уровень)
============================================================ */

function updateCastleView() {
    const img = document.getElementById("castleImage");
    img.src = `assets/castle_${game.castleLevel}.png`;
}


/* ============================================================
   СТРОИТЕЛЬСТВО ЗДАНИЙ
============================================================ */

function buildFarm() {
    if (game.gold < 100) return alert("Недостаточно золота!");
    game.gold -= 100;
    game.farms++;
    saveGame();
    updateUI();
}

function buildMine() {
    if (game.gold < 200) return alert("Недостаточно золота!");
    game.gold -= 200;
    game.mines++;
    saveGame();
    updateUI();
}

function buildMarket() {
    if (game.gold < 300) return alert("Недостаточно золота!");
    game.gold -= 300;
    game.markets++;
    saveGame();
    updateUI();
}

function buildForge() {
    if (game.gold < 150) return alert("Недостаточно золота!");
    game.gold -= 150;
    game.forges++;
    saveGame();
    updateUI();
}

function upgradeCastle() {
    if (game.castleLevel >= 8) return alert("Замок полностью построен!");

    game.castleProgress++;
    if (game.castleProgress >= 1) {
        game.castleProgress = 0;
        game.castleLevel++;
    }

    // Анимация
    const img = document.getElementById("castleImage");
    img.classList.add("castle-upgrade");
    setTimeout(() => img.classList.remove("castle-upgrade"), 900);

    saveGame();
    updateUI();
}


/* ============================================================
   МИНИ-КАРТА
============================================================ */

function updateMiniMap() {

    const map = document.getElementById("mapGrid");
    map.innerHTML = "";

    const gridSize = 100;        // 10x10
    const cells = Array(gridSize).fill(null);

    function placeBuildings(count, className) {
        for (let i = 0; i < count && i < gridSize; i++) {
            let attempts = 0;
            let pos = Math.floor(Math.random() * gridSize);

            while (cells[pos] !== null && attempts < 50) {
                pos = Math.floor(Math.random() * gridSize);
                attempts++;
            }

            if (cells[pos] === null) {
                cells[pos] = className;
            }
        }
    }

    placeBuildings(game.farms, "icon-farm");
    placeBuildings(game.mines, "icon-mine");
    placeBuildings(game.markets, "icon-market");
    placeBuildings(game.forges, "icon-forge");

    // Центр карты = индекс 55
    cells[55] = "icon-castle";

    cells.forEach(type => {
        const div = document.createElement("div");
        div.classList.add("mapCell");

        if (type) {
            const icon = document.createElement("div");
            icon.classList.add("mapIcon", type);
            div.appendChild(icon);
        }

        map.appendChild(div);
    });
}


/* ============================================================
   АРМИЯ
============================================================ */

function craftWeapon() {
    if (game.iron < 1) return alert("Нет железа");
    game.iron--;
    game.weapons++;
    saveGame();
    updateUI();
}

function recruitSoldier() {
    if (game.weapons < 1) return alert("Нет оружия");
    if (game.population < 1) return alert("Недостаточно людей");

    game.weapons--;
    game.population--;
    game.army++;

    saveGame();
    updateUI();
}


/* ============================================================
   КОНЕЦ ГОДА + ОТЧЁТ
============================================================ */

function endYear() {

    // Производство
    game.food += game.farms * 500;
    game.iron += game.mines * 10;

    // Потребление
    const foodNeed = Math.max(0, Math.floor(game.population * 0.5));
    if (game.food >= foodNeed) {
        game.food -= foodNeed;
        game.popularity += 2;
        game.population += Math.floor(game.population * 0.02); // прирост
    } else {
        game.popularity -= 4;
    }

    // Торговля даёт немного золота
    game.gold += game.markets * 20;

    // Ограничение параметров
    if (game.popularity < 0) game.popularity = 0;
    if (game.popularity > 100) game.popularity = 100;

    game.year++;

    const report = `
Год: ${game.year}
Население: ${game.population}
Еда: ${game.food}
Золото: ${game.gold}
Железо: ${game.iron}
Оружие: ${game.weapons}
Популярность: ${game.popularity}
    `;

    game.lastReport = report;

    saveGame();
    updateUI();

    showReport(report);
    checkEndGame();
}


/* ============================================================
   ПОКАЗ ОТЧЁТА
============================================================ */

function showReport(text) {
    document.getElementById("reportText").textContent = text;
    document.getElementById("reportPanel").classList.remove("hidden");
}

function closeReport() {
    document.getElementById("reportPanel").classList.add("hidden");
}


/* ============================================================
   КОНЕЦ ИГРЫ
============================================================ */

function checkEndGame() {

    // Победа
    if (
        game.population >= 10000 &&
        game.popularity >= 90 &&
        game.castleLevel >= 8 &&
        game.army >= 500 &&
        game.gold >= 1000000
    ) {
        endGame(true);
    }

    // Поражение
    if (game.year >= 1500) {
        endGame(false);
    }
}

function endGame(victory) {

    if (victory) {
        alert("🎉 Вы стали Императором!\nИгра начнётся заново, но вы получите бонусы наследия.");

        meta.completedRuns++;
        meta.bonusFood += 300;
        meta.bonusGold += 500;
        meta.bonusPopulation += 30;

        saveMeta();
    } else {
        alert("💀 Поражение. Тёмный Император вернулся.");
    }

    restartGame();
}
