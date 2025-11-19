// ======================================================
//                 ИГРОВЫЕ ДАННЫЕ
// ======================================================

let game = {
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

    castleLevel: 0,
    castleProgress: 0,

    popularity: 50,

    taxRate: 30,
    foodRate: 3,

    rankIndex: 0,
    lastReport: "",
};


// ======================================================
//                 ТИТУЛЫ
// ======================================================
const ranks = [
    { name: "Барон",   pop: 1100, popu: 60, castle: 0, army: 0,    gold: 0 },
    { name: "Граф",    pop: 1400, popu: 65, castle: 0, army: 0,    gold: 0 },
    { name: "Герцог",  pop: 2000, popu: 70, castle: 1, army: 10,   gold: 0 },
    { name: "Принц",   pop: 3000, popu: 75, castle: 2, army: 25,   gold: 0 },
    { name: "Король",  pop: 5000, popu: 80, castle: 6, army: 200,  gold: 100000 },
    { name: "Император", pop: 10000, popu: 90, castle: 8, army: 500, gold: 1000000 }
];


// ======================================================
//              АВТОСОХРАНЕНИЕ
// ======================================================
function saveGame() {
    localStorage.setItem("darkEmpireSave", JSON.stringify(game));
}

function loadGame() {
    const save = localStorage.getItem("darkEmpireSave");
    if (save) {
        game = JSON.parse(save);
        updateCastleImage();
        updateUI();
    }
}

loadGame();


// ======================================================
//              ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ======================================================
function updateUI() {
    document.getElementById("yearLabel").textContent = "Год: " + game.year;

    document.getElementById("pop").textContent = game.population;
    document.getElementById("food").textContent = game.food;
    document.getElementById("gold").textContent = game.gold.toLocaleString();
    document.getElementById("iron").textContent = game.iron;
    document.getElementById("weapons").textContent = game.weapons;
    document.getElementById("army").textContent = game.army;
    document.getElementById("popularity").textContent = game.popularity + "%";
    document.getElementById("castle").textContent = game.castleLevel + " / 8";
    document.getElementById("rank").textContent = ranks[game.rankIndex].name;

    document.getElementById("taxRate").value = game.taxRate;
    document.getElementById("foodRate").value = game.foodRate;

    updateAdvisor();
    updateCastleImage();
    updateMiniMap();

}


// ======================================================
//                ОБНОВЛЕНИЕ ЗАМКА
// ======================================================
function updateCastleImage() {
    const img = document.getElementById("castleImage");
    let lvl = Math.max(1, game.castleLevel);
    img.src = `assets/castle${lvl}.png`;
}


// ======================================================
//                СОВЕТНИК
// ======================================================
function updateAdvisor() {
    const r = ranks[game.rankIndex];
    let msg =
        `Чтобы стать ${r.name}:\n\n` +
        `Жители: ${game.population}/${r.pop}\n` +
        `Популярность: ${game.popularity}/${r.popu}\n` +
        `Замок: ${game.castleLevel}/${r.castle}\n` +
        `Солдаты: ${game.army}/${r.army}\n` +
        `Золото: ${game.gold}/${r.gold}`;

    document.getElementById("advisor").textContent = msg;
}


// ======================================================
//                СТРОИТЕЛЬСТВО
// ======================================================
function build(type) {
    if (type === "farm" && game.gold >= 100) { game.farms++; game.gold -= 100; }
    else if (type === "mine" && game.gold >= 200) { game.mines++; game.gold -= 200; }
    else if (type === "market" && game.gold >= 300) { game.markets++; game.gold -= 300; }
    else if (type === "forge" && game.gold >= 150) { game.forges++; game.gold -= 150; }
    else {
        alert("Недостаточно золота!");
        return;
    }

    saveGame();
    updateUI();
}

function upgradeCastle() {
    if (game.castleLevel >= 8) {
        alert("Замок уже достроен!");
        return;
    }

    game.castleProgress++;
    if (game.castleProgress >= 1) {
        game.castleLevel++;
        game.castleProgress = 0;
    }

    saveGame();
    const castle = document.getElementById("castleImage");
castle.classList.add("castle-upgrade");

setTimeout(() => {
    castle.classList.remove("castle-upgrade");
}, 1200);
    updateUI();
}


// ======================================================
//                АРМИЯ
// ======================================================
function craftWeapon() {
    if (game.forges === 0) return alert("Нужна кузница!");
    if (game.iron < 1) return alert("Нет железа!");

    game.weapons++;
    game.iron--;

    saveGame();
    updateUI();
}

function hireSoldier() {
    if (game.weapons < 1) return alert("Нет оружия!");
    if (game.population < 1) return alert("Нет свободных жителей!");

    game.weapons--;
    game.population--;
    game.army++;

    saveGame();
    updateUI();
}


// ======================================================
//                ТОРГОВЛЯ
// ======================================================
function foodPrice() {
    let harvest = game.farms * (400 + Math.floor(Math.random() * 200));
    return harvest < 3000 ? 3 : 1;
}

function sellFood() {
    if (game.markets < 1) return alert("Нужно минимум 1 рынок!");
    if (game.food < 100) return alert("Нет еды!");

    let price = foodPrice();
    game.food -= 100;
    game.gold += price * 100;

    saveGame();
    updateUI();
}

function buyFood() {
    if (game.markets < 1) return alert("Нужно минимум 1 рынок!");

    let price = foodPrice();
    if (game.gold < price * 100) return alert("Недостаточно золота!");

    game.gold -= price * 100;
    game.food += 100;

    saveGame();
    updateUI();
}

function sellIron() {
    if (game.markets < 5) return alert("Нужно 5 рынков!");
    if (game.iron < 10) return alert("Нет железа!");

    game.iron -= 10;
    game.gold += 50 * 10;

    saveGame();
    updateUI();
}

function buyIron() {
    if (game.markets < 5) return alert("Нужно 5 рынков!");

    if (game.gold < 50 * 10) return alert("Недостаточно золота!");

    game.gold -= 50 * 10;
    game.iron += 10;

    saveGame();
    updateUI();
}

function sellWeapons() {
    if (game.markets < 10) return alert("Нужно 10 рынков!");
    if (game.weapons < 10) return alert("Нет оружия!");

    game.weapons -= 10;
    game.gold += 150 * 10;

    saveGame();
    updateUI();
}

function buyWeapons() {
    if (game.markets < 10) return alert("Нужно 10 рынков!");
    if (game.gold < 150 * 10) return alert("Недостаточно золота!");

    game.gold -= 150 * 10;
    game.weapons += 10;

    saveGame();
    updateUI();
}


// ======================================================
//           АНИМАЦИЯ ОТЧЁТА
// ======================================================
function showReportAnimated(text) {
    const panel = document.getElementById("reportPanel");
    const box = document.getElementById("reportText");

    panel.classList.remove("hidden");
    box.innerHTML = "";

    let i = 0;
    function typeChar() {
        if (i < text.length) {
            box.innerHTML += text[i];
            i++;
            setTimeout(typeChar, 8);
        }
    }
    typeChar();
}

function closeReport() {
    document.getElementById("reportPanel").classList.add("hidden");
}

// ======================================================
//              НОВЫЕ СЛУЧАЙНЫЕ СОБЫТИЯ
// ======================================================

function randomEvent() {
    let roll = Math.random();

    // --- 5% ЭПИДЕМИЯ ---
    if (roll < 0.05) {
        let loss = Math.floor(game.population * (0.10 + Math.random() * 0.15));
        game.population -= loss;
        game.popularity -= 5 + Math.floor(Math.random() * 10);
        return `⚠ ЭПИДЕМИЯ!\nПогибло ${loss} жителей.\nПопулярность сильно снизилась.`;
    }

    // --- 5% ПОЖАР ---
    if (roll < 0.10) {
        let destroyed = [];

        function burn(typeName, countVar) {
            if (game[countVar] > 0) {
                game[countVar]--;
                destroyed.push(typeName);
            }
        }

        burn("Ферма", "farms");
        burn("Шахта", "mines");
        burn("Рынок", "markets");
        burn("Кузница", "forges");

        if (destroyed.length === 0)
            return "🔥 Пожар, но никто не пострадал.";

        return `🔥 ПОЖАР!\nУничтожено зданий: ${destroyed.join(", ")}.`;
    }

    // --- 8% РАЗБОЙНИКИ ---
    if (roll < 0.18) {
        let stolenGold = Math.floor(50 + Math.random() * 200);
        if (stolenGold > game.gold) stolenGold = game.gold;

        if (game.army < 50) {
            let kill = Math.floor(10 + Math.random() * 20);
            game.population -= kill;
            game.gold -= stolenGold;
            return `⚔ НАПАДЕНИЕ РАЗБОЙНИКОВ!\nПохищено ${stolenGold} золота.\nПогибло жителей: ${kill}.\nАрмия слишком мала.`;
        } else {
            game.gold -= Math.floor(stolenGold / 2);
            return `⚔ Разбойники атаковали, но армия защитила деревню.\nПотери золота: ${Math.floor(stolenGold/2)}.`;
        }
    }

    // --- 10% СЛУЧАЙНОЕ БЛАГОСЛОВЕНИЕ ---
    if (roll < 0.28) {
        let blessing = Math.floor(100 + Math.random() * 300);
        game.gold += blessing;
        return `✨ Благословение Севера.\nПолучено ${blessing} золота.`;
    }

    // --- 10% УРОЖАЙНЫЙ ГОД ---
    if (roll < 0.38) {
        let bonus = Math.floor(300 + Math.random() * 300);
        game.food += bonus;
        return `🌾 Урожайный год!\nДополнительно получено ${bonus} еды.`;
    }

    // --- 5% ОБВАЛ РЫНКА ---
    if (roll < 0.43) {
        let loss = Math.floor(game.gold * 0.10);
        game.gold -= loss;
        return `📉 Обвал рынка.\nПотери золота: ${loss}.`;
    }

    // --- 5% ПРОКЛЯТИЕ ТЁМНОГО ИМПЕРАТОРА ---
    if (roll < 0.48 && game.year >= 1480) {
        let drain = Math.floor(game.food * 0.15);
        game.food -= drain;
        game.popularity -= 5;
        return `🩸 Колдовство Тёмного Императора!\nЧасть продовольствия исчезла (${drain}).\nПопулярность упала.`;
    }

    return null; // нет события
}

// ======================================================
//           ГОДОВОЙ ХОД
// ======================================================
function endTurn() {
    game.taxRate = parseInt(document.getElementById("taxRate").value);
    game.foodRate = parseInt(document.getElementById("foodRate").value);

    let report = `ОТЧЁТ ЗА ${game.year} ГОД\n\n`;

    // Урожай
    let harvest = game.farms * (400 + Math.floor(Math.random() * 200));
    game.food += harvest;
    report += `Урожай: +${harvest} еды\n`;

    // Железо
    let ironGain = game.mines * 10;
    game.iron += ironGain;
    report += `Добыто железа: +${ironGain}\n`;

    // Расход еды
    let needFood = game.population * game.foodRate;

    if (game.food >= needFood) {
        game.food -= needFood;
        game.popularity += 1;
        game.population += Math.floor(game.population * 0.01) + 20;
        report += "Еды хватило. Популярность ↑\n";
    } else {
        game.popularity -= 3;
        game.population -= Math.floor(game.population * 0.05);
        report += "Еды НЕ хватило. Популярность ↓\n";
    }

    // Налоги
    let income = Math.floor(game.population * (game.taxRate / 100));
    game.gold += income;
    game.popularity -= Math.floor(game.taxRate / 20);
    report += `Налоги: +${income} золота\n`;

    // Иммиграция
    if (game.popularity >= 70) {
        game.population += 30;
        report += "Иммиграция: +30 жителей\n";
    }

    // Ограничения
    if (game.popularity < 0) game.popularity = 0;
    if (game.popularity > 100) game.popularity = 100;

// --- СЛУЧАЙНОЕ СОБЫТИЕ ---
let eventText = randomEvent();
if (eventText) {
    report += "\n\nСобытие:\n" + eventText + "\n";
}

    // РАНГИ
    checkRank();

    // год заканчивается
    game.year++;

    // победа/поражение
    if (ranks[game.rankIndex].name === "Император") {
        alert("🎉 Победа! Вы стали Императором!");
    }
    if (game.year >= 1500 && ranks[game.rankIndex].name !== "Император") {
        alert("❌ Вы проиграли! Тёмный Император вернулся.");
    }

    // Отчёт
    game.lastReport = report;
    showReportAnimated(report);

    saveGame();
    updateUI();
}


function checkRank() {
    const req = ranks[game.rankIndex];

    if (
        game.population >= req.pop &&
        game.popularity >= req.popu &&
        game.castleLevel >= req.castle &&
        game.army >= req.army &&
        game.gold >= req.gold
    ) {
        if (game.rankIndex < ranks.length - 1) {
            game.rankIndex++;
            alert("🎖 Новый титул: " + ranks[game.rankIndex].name);
        }
    }
}
function updateMiniMap() {
    const map = document.getElementById("mapGrid");
    if (!map) return;

    map.innerHTML = "";

    const gridSize = 100; // 10×10 клеток
    const cells = Array(gridSize).fill(null);

    // размещение зданий в случайных фиксированных клетках
    function placeBuildings(count, className) {
        for (let i = 0; i < count; i++) {
            let pos = Math.floor(Math.random() * gridSize);

            // поиск свободной клетки
            while (cells[pos] !== null) {
                pos = Math.floor(Math.random() * gridSize);
            }
            cells[pos] = className;
        }
    }

    placeBuildings(game.farms, "icon-farm");
    placeBuildings(game.mines, "icon-mine");
    placeBuildings(game.markets, "icon-market");
    placeBuildings(game.forges, "icon-forge");

    // замок всегда по центру
    cells[44] = "icon-castle";

    // создаём DOM
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
// ==============================
// ГЛОБАЛЬНЫЙ МЕТА-ПРОГРЕСС
// ==============================

// Здесь можно хранить бонусы, которые будут действовать в следующих прохождениях
let meta = JSON.parse(localStorage.getItem("metaProgress")) || {
    completedRuns: 0,
    bonusFood: 0,
    bonusGold: 0,
    bonusPopulation: 0
};

function saveMeta() {
    localStorage.setItem("metaProgress", JSON.stringify(meta));
}


// ==============================
// КОНЕЦ ИГРЫ: ПОБЕДА / ПОРАЖЕНИЕ
// ==============================

function checkEndGame() {
    // Победа: игрок стал императором
    if (game.castleLevel === 8 && game.population >= 10000 && game.popularity >= 90 && game.army >= 500 && game.gold >= 1000000) {
        endGame(true);
    }

    // Поражение: настал 1500 год
    if (game.year >= 1500) {
        endGame(false);
    }
}

function endGame(victory) {

    if (victory) {
        alert("🎉 Победа! Вы стали новым Императором!\nИгра начнётся заново, но ваш прогресс сохранён.");

        // МЕТА-БОНУСЫ за победу
        meta.completedRuns++;
        meta.bonusFood += 200;
        meta.bonusGold += 500;
        meta.bonusPopulation += 20;
        saveMeta();

    } else {
        alert("💀 Поражение! Тёмный Император вернулся...\nПопробуйте снова — вы станете сильнее.");
    }

    restartGame();
}


// ==============================
// СТАРТ НОВОЙ ИГРЫ
// ==============================

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
        castleLevel: 0
    };

    updateUI();
}
// ======================================================
//                 СТАРТ
// ======================================================
updateUI();



