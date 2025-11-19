/* ============================================================
   INITIAL GAME DATA + META PROGRESSION
============================================================ */

let meta = JSON.parse(localStorage.getItem("metaProgress")) || {
    completedRuns: 0,
    bonusFood: 0,
    bonusGold: 0,
    bonusPopulation: 0
};

let game = JSON.parse(localStorage.getItem("gameData")) || null;

if (!game) restartGame();


/* ============================================================
   SAVE SYSTEM
============================================================ */

function saveGame() {
    localStorage.setItem("gameData", JSON.stringify(game));
}

function saveMeta() {
    localStorage.setItem("metaProgress", JSON.stringify(meta));
}


/* ============================================================
   NEW GAME (WITH META BONUSES)
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

        farms: 0,
        mines: 0,
        markets: 0,
        forges: 0,

        popularity: 50,

        taxRate: 30,
        foodRate: 3,

        castleLevel: 0,
        castleProgress: 0,

        rankIndex: 0,
        lastReport: ""
    };

    saveGame();
    updateCastleImage();
    updateUI();
}


/* ============================================================
   RANK SYSTEM
============================================================ */

const ranks = [
    { name: "Барон", pop: 1100, popu: 60, castle: 0, army: 0, gold: 0 },
    { name: "Граф", pop: 1400, popu: 65, castle: 0, army: 0, gold: 0 },
    { name: "Герцог", pop: 2000, popu: 70, castle: 1, army: 10, gold: 0 },
    { name: "Принц", pop: 3000, popu: 75, castle: 2, army: 25, gold: 0 },
    { name: "Король", pop: 5000, popu: 80, castle: 6, army: 200, gold: 100000 },
    { name: "Император", pop: 10000, popu: 90, castle: 8, army: 500, gold: 1000000 }
];

function checkRank() {
    const r = ranks[game.rankIndex];
    if (
        game.population >= r.pop &&
        game.popularity >= r.popu &&
        game.castleLevel >= r.castle &&
        game.army >= r.army &&
        game.gold >= r.gold
    ) {
        if (game.rankIndex < ranks.length - 1) {
            game.rankIndex++;
        }
    }
}


/* ============================================================
   UI UPDATE
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

    document.getElementById("currentRank").textContent =
        ranks[game.rankIndex].name;

    updateCastleImage();
    updateMiniMap();
}


/* ============================================================
   CASTLE GRAPHICS
============================================================ */

function updateCastleImage() {
    document.getElementById("castleImage").src =
        `assets/castle_${game.castleLevel}.png`;
}


/* ============================================================
   BUILDINGS
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

    const img = document.getElementById("castleImage");
    img.classList.add("castle-upgrade");
    setTimeout(() => img.classList.remove("castle-upgrade"), 900);

    saveGame();
    updateUI();
}


/* ============================================================
   MINI MAP
============================================================ */

function updateMiniMap() {

    const map = document.getElementById("mapGrid");
    map.innerHTML = "";

    const size = 100;
    const cells = Array(size).fill(null);

    function place(count, type) {
        for (let i = 0; i < count && i < size; i++) {
            let pos = Math.floor(Math.random() * size);
            let attempts = 0;

            while (cells[pos] !== null && attempts < 30) {
                pos = Math.floor(Math.random() * size);
                attempts++;
            }

            if (cells[pos] === null) cells[pos] = type;
        }
    }

    place(game.farms, "icon-farm");
    place(game.mines, "icon-mine");
    place(game.markets, "icon-market");
    place(game.forges, "icon-forge");

    cells[55] = "icon-castle";

    cells.forEach(type => {
        const c = document.createElement("div");
        c.classList.add("mapCell");

        if (type) {
            const i = document.createElement("div");
            i.classList.add("mapIcon", type);
            c.appendChild(i);
        }

        map.appendChild(c);
    });
}


/* ============================================================
   ARMY
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
    if (game.population < 1) return alert("Нет людей");

    game.weapons--;
    game.population--;
    game.army++;

    saveGame();
    updateUI();
}


/* ============================================================
   END OF YEAR
============================================================ */

function endTurn() {

    // Производство
    game.food += game.farms * 500;
    game.iron += game.mines * 10;

    // Потребление
    const foodNeed = Math.floor(game.population * (game.foodRate / 10));
    if (game.food >= foodNeed) {
        game.food -= foodNeed;
        game.population += Math.floor(game.population * 0.02);
        game.popularity += 1;
    } else {
        game.popularity -= 3;
    }

    // Налоги
    game.gold += Math.floor(game.population * (game.taxRate / 100));

    if (game.popularity < 0) game.popularity = 0;
    if (game.popularity > 100) game.popularity = 100;

    // Ранг
    checkRank();

    // Год
    game.year++;

    const report =
`Год: ${game.year}
Популяция: ${game.population}
Еда: ${game.food}
Золото: ${game.gold}
Железо: ${game.iron}
Оружие: ${game.weapons}
Популярность: ${game.popularity}
`;

    game.lastReport = report;
    showReportAnimated(report);

    saveGame();
    updateUI();

    // Победа
    if (ranks[game.rankIndex].name === "Император") {
        endGame(true);
        return;
    }

    // Поражение
    if (game.year >= 1500) {
        endGame(false);
        return;
    }
}


/* ============================================================
   REPORT SCREEN
============================================================ */

function showReportAnimated(text) {
    document.getElementById("reportText").textContent = text;
    document.getElementById("reportPanel").classList.remove("hidden");
}

function closeReport() {
    document.getElementById("reportPanel").classList.add("hidden");
}


/* ============================================================
   END GAME + META PROGRESSION
============================================================ */

function endGame(victory) {

    if (victory) {
        alert("🎉 Вы стали Императором!\nНовая игра начнётся с бонусами наследия.");

        meta.completedRuns++;
        meta.bonusFood += 300;
        meta.bonusGold += 500;
        meta.bonusPopulation += 30;

        saveMeta();
    } else {
        alert("💀 Поражение! Тёмный Император вернулся.");
    }

    restartGame();
}
