// ======================================================
//                ИМПЕРИЯ ТЬМЫ — GAME.JS
//     Демография + Бунты + Элиты + Коллапс инфляции
// ======================================================

"use strict";

const STORAGE_KEY = "dark_empire_state_v2";

// Ранги (можешь править под баланс)
const RANKS = [
  { name: "Крестьянин",   minPopulation: 0,    minPopularity: 0,  minCastle: 0 },
  { name: "Барон",        minPopulation: 1100, minPopularity: 60, minCastle: 0 },
  { name: "Граф",         minPopulation: 1400, minPopularity: 65, minCastle: 0 },
  { name: "Герцог",       minPopulation: 2000, minPopularity: 70, minCastle: 1 },
  { name: "Принц",        minPopulation: 3000, minPopularity: 75, minCastle: 2 },
  { name: "Король",       minPopulation: 5000, minPopularity: 80, minCastle: 6 },
  { name: "Император",    minPopulation: 10000,minPopularity: 90, minCastle: 8 }
];

// Картинки замка по уровням (поставь свои пути)
const CASTLE_IMAGES = [
  "img/castle_0.png", // уровень 0
  "img/castle_1.png", // уровень 1
  "img/castle_2.png", // уровень 2
  "img/castle_3.png", // уровень 3
  "img/castle_4.png", // уровень 4
  "img/castle_5.png", // уровень 5
  "img/castle_6.png", // уровень 6+
  "img/castle_7.png"
];

let game = null;

// ======================================================
//                   СОЗДАНИЕ ИГРЫ
// ======================================================

function createInitialGameState() {
  // базовая демография
  const peasants = 900;
  const burghers = 90;
  const nobles = 10;

  return {
    year: 1450,

    // ресурсы
    food: 5000,
    gold: 1000,
    iron: 0,
    weapons: 0,
    army: 0,

    // прогресс
    popularity: 60,      // 0..100
    castleLevel: 0,      // 0..8
    farms: 0,
    mines: 0,
    markets: 0,
    forges: 0,

    // политики
    taxRate: 10,         // 0..100
    foodRate: 1.0,       // 0..10

    // экономика
    priceIndex: 1.0,     // общий уровень цен (1.0 базовый)
    inflationRate: 0,    // инфляция за последний год (%)
    lastCollapseYear: null,

    // демография по классам
    classes: {
      peasants,
      burghers,
      nobles
    },

    // вычисляемое
    population: peasants + burghers + nobles,
    rankName: "",

    // флаги
    gameOver: false
  };
}

// ======================================================
//                 ЗАГРУЗКА / СОХРАНЕНИЕ
// ======================================================

function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const base = createInitialGameState();

    // мягкое слияние
    const merged = Object.assign(base, parsed);
    merged.classes = Object.assign(base.classes, parsed.classes || {});
    merged.population =
      (merged.classes.peasants || 0) +
      (merged.classes.burghers || 0) +
      (merged.classes.nobles || 0);

    merged.popularity = clamp(merged.popularity, 0, 100);
    merged.castleLevel = clamp(merged.castleLevel, 0, 8);

    if (typeof merged.priceIndex !== "number" || merged.priceIndex <= 0) merged.priceIndex = 1.0;
    if (typeof merged.inflationRate !== "number") merged.inflationRate = 0;

    return merged;
  } catch (e) {
    console.warn("Не удалось загрузить игру:", e);
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
//                    УТИЛИТЫ
// ======================================================

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fmt(n) {
  try {
    return Number(n).toLocaleString("ru-RU");
  } catch {
    return String(n);
  }
}

function getPopTotal() {
  return (game.classes.peasants || 0) + (game.classes.burghers || 0) + (game.classes.nobles || 0);
}

function ensureNotGameOver() {
  if (game.gameOver) {
    alert("Игра окончена. Нажмите «Сбросить игру», чтобы начать заново.");
    return false;
  }
  return true;
}

// ======================================================
//                     РАНГ
// ======================================================

function updateRank() {
  let best = RANKS[0];
  for (const r of RANKS) {
    if (
      game.population >= r.minPopulation &&
      game.popularity >= r.minPopularity &&
      game.castleLevel >= r.minCastle
    ) {
      best = r;
    }
  }
  game.rankName = best.name;
}

function getNextRankInfo() {
  updateRank();
  const currentIndex = RANKS.findIndex((r) => r.name === game.rankName);
  const next = RANKS[currentIndex + 1];
  if (!next) return null;

  return {
    name: next.name,
    needPop: Math.max(0, next.minPopulation - game.population),
    needPopularity: Math.max(0, next.minPopularity - game.popularity),
    needCastle: Math.max(0, next.minCastle - game.castleLevel)
  };
}

// ======================================================
//                  ЗАМОК: КАРТИНКА
// ======================================================

function updateCastleImage() {
  const img = document.getElementById("castleImage");
  if (!img) return;

  let idx = clamp(game.castleLevel, 0, CASTLE_IMAGES.length - 1);
  img.src = CASTLE_IMAGES[idx];
}

// ======================================================
//                     UI
// ======================================================

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

function writeRatesToUI() {
  const taxSlider = document.getElementById("taxRate");
  const foodSlider = document.getElementById("foodRate");
  const taxValue = document.getElementById("taxValue");
  const foodValue = document.getElementById("foodValue");

  if (taxSlider) taxSlider.value = String(game.taxRate);
  if (foodSlider) foodSlider.value = String(game.foodRate);

  if (taxValue) taxValue.textContent = String(game.taxRate);
  if (foodValue) foodValue.textContent = String(game.foodRate);
}

function updateStatsUI() {
  const yearLabel = document.getElementById("yearLabel");
  if (yearLabel) yearLabel.textContent = "Год: " + game.year;

  setText("pop", fmt(game.population));
  setText("food", fmt(game.food));
  setText("gold", fmt(game.gold));
  setText("iron", fmt(game.iron));
  setText("weapons", fmt(game.weapons));
  setText("army", fmt(game.army));
  setText("popularity", game.popularity + " / 100");
  setText("castle", "Уровень " + game.castleLevel);
  setText("rank", game.rankName || "");

  // если есть поле инфляции
  const infl = document.getElementById("inflation");
  if (infl) infl.textContent = (game.inflationRate || 0).toFixed(1) + " %";
}

function updateAdvisor() {
  const el = document.getElementById("advisor");
  if (!el) return;

  const total = game.population;
  const yearlyFoodNeed = Math.round(total * game.foodRate);
  const inflation = game.inflationRate || 0;
  const nobles = game.classes.nobles || 0;

  let msg = "";

  if (game.gameOver) {
    msg = "Игра окончена. Нажмите «Сбросить игру», чтобы начать заново.";
    el.textContent = msg;
    return;
  }

  // Сильные сигналы
  if (game.popularity < 15) {
    msg = "Народ на грани бунта. Срочно снижайте налоги и повышайте рацион. Ещё год, и улицы станут вашим троном... на одну ночь.";
  } else if (game.food < yearlyFoodNeed * 0.5) {
    msg = "Запасов еды критически мало. Фермы или закуп еды. Иначе демография быстро превратится в некролог.";
  } else if (inflation > 25) {
    msg = "Инфляция превысила 25%. Экономика трещит. Стройте и инвестируйте, не копите золото, и снижайте давление налогами.";
  } else if (nobles > 80 && game.castleLevel < 4) {
    msg = "Знать возмущена слабым замком. Они считают, что вы позорите их род. Улучшайте замок, иначе начнутся заговоры.";
  } else {
    // подсказка на следующий ранг
    const next = getNextRankInfo();
    if (next) {
      const need = [];
      if (next.needPop > 0) need.push("население +" + fmt(next.needPop));
      if (next.needPopularity > 0) need.push("популярность +" + fmt(next.needPopularity));
      if (next.needCastle > 0) need.push("замок +" + fmt(next.needCastle));
      msg = `До звания "${next.name}" не хватает: ${need.join(", ")}.`;
    } else {
      msg = "Вы достигли вершины. Империя слушает ваш шёпот, как приговор.";
    }
  }

  el.textContent = msg;
}

function updatePricesUI() {
  // Если у тебя есть кнопки с такими id — обновим тексты. Если нет — не упадём.
  const btnFarm   = document.getElementById("btnBuildFarm");
  const btnMine   = document.getElementById("btnBuildMine");
  const btnMarket = document.getElementById("btnBuildMarket");
  const btnForge  = document.getElementById("btnBuildForge");
  const btnCastle = document.getElementById("btnUpgradeCastle");
  const btnHire   = document.getElementById("btnHireSoldier");

  if (btnFarm)   btnFarm.textContent   = "Построить ферму (+500 еды) — " + fmt(getBuildingCost("farm")) + " золота";
  if (btnMine)   btnMine.textContent   = "Построить шахту (+10 железа) — " + fmt(getBuildingCost("mine")) + " золота";
  if (btnMarket) btnMarket.textContent = "Построить рынок — " + fmt(getBuildingCost("market")) + " золота";
  if (btnForge)  btnForge.textContent  = "Построить кузницу — " + fmt(getBuildingCost("forge")) + " золота";

  if (btnCastle) {
    const nextLevel = game.castleLevel + 1;
    const cost = getCastleUpgradeCost(nextLevel);
    btnCastle.textContent = "Улучшить замок до уровня " + nextLevel + " — " + fmt(cost) + " золота";
  }

  if (btnHire) {
    const soldierCost = getSoldierGoldCost();
    btnHire.textContent = "Нанять солдата (" + fmt(soldierCost) + " золота + 1 оружие)";
  }
}

function updateTradeButtons() {
  const btnBuyFood  = document.getElementById("btnBuyFood");
  const btnSellFood = document.getElementById("btnSellFood");
  const btnBuyIron  = document.getElementById("btnBuyIron");
  const btnSellIron = document.getElementById("btnSellIron");

  const fp = getFoodTradePack();
  const ip = getIronTradePack();

  if (btnBuyFood)  btnBuyFood.textContent  = "Купить " + fmt(fp.packSize) + " еды — " + fmt(fp.buyCost) + " золота";
  if (btnSellFood) btnSellFood.textContent = "Продать " + fmt(fp.packSize) + " еды — " + fmt(fp.sellGain) + " золота";
  if (btnBuyIron)  btnBuyIron.textContent  = "Купить " + fmt(ip.packSize) + " железа — " + fmt(ip.buyCost) + " золота";
  if (btnSellIron) btnSellIron.textContent = "Продать " + fmt(ip.packSize) + " железа — " + fmt(ip.sellGain) + " золота";
}

function updateUI() {
  updateRank();
  writeRatesToUI();
  updateStatsUI();
  updateAdvisor();
  updatePricesUI();
  updateTradeButtons();
  updateCastleImage();
}

// ======================================================
//                  ОТЧЁТ (POPUP)
// ======================================================

function showReport(text) {
  const panel = document.getElementById("reportPanel");
  const reportText = document.getElementById("reportText");
  if (!panel || !reportText) return;

  reportText.textContent = text;
  panel.classList.remove("hidden");
}

function closeReport() {
  const panel = document.getElementById("reportPanel");
  if (!panel) return;
  panel.classList.add("hidden");
}

// ======================================================
//               ДИНАМИЧЕСКИЕ ЦЕНЫ
// ======================================================

function getBuildingCost(type) {
  const pi = game.priceIndex || 1;
  let base = 0;

  switch (type) {
    case "farm":   base = 100 + game.farms * 50; break;
    case "mine":   base = 200 + game.mines * 75; break;
    case "market": base = 300 + game.markets * 100; break;
    case "forge":  base = 150 + game.forges * 60; break;
    default: return Infinity;
  }
  return Math.round(base * pi);
}

function getCastleUpgradeCost(nextLevel) {
  const pi = game.priceIndex || 1;
  return Math.round(500 * nextLevel * pi);
}

function getSoldierGoldCost() {
  const pi = game.priceIndex || 1;
  return Math.round(50 * pi);
}

// ======================================================
//                 ТОРГОВЛЯ
// ======================================================

function getFoodTradePack() {
  const pi = game.priceIndex || 1;
  const packSize = 100;
  const baseBuy = 20;
  const baseSell = 10;
  const marketBonus = Math.min(game.markets * 0.03, 0.25);

  const buyCost  = Math.max(1, Math.round(baseBuy  * pi * (1 - marketBonus)));
  const sellGain = Math.max(1, Math.round(baseSell * pi * (1 + marketBonus)));
  return { packSize, buyCost, sellGain };
}

function getIronTradePack() {
  const pi = game.priceIndex || 1;
  const packSize = 10;
  const baseBuy = 80;
  const baseSell = 50;
  const marketBonus = Math.min(game.markets * 0.03, 0.25);

  const buyCost  = Math.max(1, Math.round(baseBuy  * pi * (1 - marketBonus)));
  const sellGain = Math.max(1, Math.round(baseSell * pi * (1 + marketBonus)));
  return { packSize, buyCost, sellGain };
}

// ======================================================
//                 ДЕЙСТВИЯ (КНОПКИ)
// ======================================================

function build(type) {
  if (!ensureNotGameOver()) return;

  const cost = getBuildingCost(type);

  switch (type) {
    case "farm":
      if (game.gold < cost) return alert("Недостаточно золота для фермы. Нужно " + fmt(cost) + ".");
      game.gold -= cost; game.farms += 1; break;
    case "mine":
      if (game.gold < cost) return alert("Недостаточно золота для шахты. Нужно " + fmt(cost) + ".");
      game.gold -= cost; game.mines += 1; break;
    case "market":
      if (game.gold < cost) return alert("Недостаточно золота для рынка. Нужно " + fmt(cost) + ".");
      game.gold -= cost; game.markets += 1; break;
    case "forge":
      if (game.gold < cost) return alert("Недостаточно золота для кузницы. Нужно " + fmt(cost) + ".");
      game.gold -= cost; game.forges += 1; break;
    default:
      return;
  }

  game.popularity = clamp(game.popularity + 1, 0, 100);
  saveGame();
  updateUI();
}

function upgradeCastle() {
  if (!ensureNotGameOver()) return;
  if (game.castleLevel >= 8) return alert("Замок уже максимального уровня.");

  const nextLevel = game.castleLevel + 1;
  const cost = getCastleUpgradeCost(nextLevel);

  if (game.gold < cost) return alert("Недостаточно золота. Нужно " + fmt(cost) + ".");

  game.gold -= cost;
  game.castleLevel = nextLevel;
  game.popularity = clamp(game.popularity + 3, 0, 100);

  saveGame();
  updateUI();
  alert("Замок улучшен до уровня " + nextLevel + "!");
}

function craftWeapon() {
  if (!ensureNotGameOver()) return;
  if (game.iron <= 0) return alert("Нет железа для ковки оружия.");

  const amount = Math.min(game.iron, 10);
  game.iron -= amount;
  game.weapons += amount;

  saveGame();
  updateUI();
}

function hireSoldier() {
  if (!ensureNotGameOver()) return;
  if (game.weapons < 1) return alert("Недостаточно оружия для найма солдата.");

  const cost = getSoldierGoldCost();
  if (game.gold < cost) return alert("Нужно " + fmt(cost) + " золота для найма солдата.");

  game.weapons -= 1;
  game.gold -= cost;
  game.army += 1;
  game.popularity = clamp(game.popularity - 1, 0, 100);

  saveGame();
  updateUI();
}

function buyFood() {
  if (!ensureNotGameOver()) return;
  const { packSize, buyCost } = getFoodTradePack();
  if (game.gold < buyCost) return alert("Недостаточно золота. Нужно " + fmt(buyCost) + ".");
  game.gold -= buyCost;
  game.food += packSize;
  saveGame();
  updateUI();
}

function sellFood() {
  if (!ensureNotGameOver()) return;
  const { packSize, sellGain } = getFoodTradePack();
  if (game.food < packSize) return alert("Недостаточно еды. Нужно " + fmt(packSize) + ".");
  game.food -= packSize;
  game.gold += sellGain;
  saveGame();
  updateUI();
}

function buyIron() {
  if (!ensureNotGameOver()) return;
  const { packSize, buyCost } = getIronTradePack();
  if (game.gold < buyCost) return alert("Недостаточно золота. Нужно " + fmt(buyCost) + ".");
  game.gold -= buyCost;
  game.iron += packSize;
  saveGame();
  updateUI();
}

function sellIron() {
  if (!ensureNotGameOver()) return;
  const { packSize, sellGain } = getIronTradePack();
  if (game.iron < packSize) return alert("Недостаточно железа. Нужно " + fmt(packSize) + ".");
  game.iron -= packSize;
  game.gold += sellGain;
  saveGame();
  updateUI();
}

// ======================================================
//                 СЛУЧАЙНЫЕ СОБЫТИЯ
// ======================================================

function applyRandomEvents(report) {
  const roll = Math.random();

  // Чума
  if (roll < 0.04 && game.population > 500) {
    const victims = Math.round(game.population * 0.05);
    applyPopulationLoss(victims);
    game.popularity = clamp(game.popularity - 5, 0, 100);
    report.push("Чума прошлась по землям! Умерло " + fmt(victims) + " жителей.");
    return;
  }

  // Урожай / неурожай
  if (game.farms > 0 && roll < 0.10) {
    if (Math.random() < 0.5) {
      const loss = Math.round(game.farms * 200);
      game.food = Math.max(0, game.food - loss);
      game.popularity = clamp(game.popularity - 3, 0, 100);
      report.push("Неурожай: часть запасов испортилась (" + fmt(loss) + " еды).");
    } else {
      const bonus = Math.round(game.farms * 300);
      game.food += bonus;
      game.popularity = clamp(game.popularity + 2, 0, 100);
      report.push("Урожайный год! Дополнительно собрано " + fmt(bonus) + " еды.");
    }
    return;
  }

  // Разбойники
  if (roll < 0.12 && game.army === 0 && game.gold > 100) {
    const stolen = Math.round(game.gold * 0.3);
    game.gold -= stolen;
    game.popularity = clamp(game.popularity - 4, 0, 100);
    report.push("Разбойники разграбили казну! Потеряно " + fmt(stolen) + " золота.");
    return;
  }

  // Набег армии
  if (roll < 0.12 && game.army > 0) {
    const loot = 100 + Math.round(game.army * 3);
    game.gold += loot;
    game.popularity = clamp(game.popularity - 1, 0, 100);
    report.push("Армия совершила удачный набег и принесла " + fmt(loot) + " золота.");
    return;
  }
}

// ======================================================
//                ДЕМОГРАФИЯ (КЛАССЫ)
// ======================================================

function applyPopulationLoss(loss) {
  loss = Math.max(0, Math.min(loss, game.population));
  if (loss <= 0) return;

  // сначала крестьяне, потом горожане, потом знать (знать умирает меньше)
  let remaining = loss;

  const peasantsLoss = Math.min(game.classes.peasants, Math.round(remaining * 0.75));
  game.classes.peasants -= peasantsLoss;
  remaining -= peasantsLoss;

  const burghersLoss = Math.min(game.classes.burghers, Math.round(remaining * 0.8));
  game.classes.burghers -= burghersLoss;
  remaining -= burghersLoss;

  const noblesLoss = Math.min(game.classes.nobles, remaining);
  game.classes.nobles -= noblesLoss;

  game.population = getPopTotal();
}

function applyDemography(report, hungerDeaths) {
  const total = game.population;
  if (total <= 0) return;

  // Рождаемость зависит от популярности и рациона
  // базовая 2% + модификаторы
  const baseBirthRate = 0.02;
  const popMod = (game.popularity - 50) / 250;      // -0.2..+0.2 примерно
  const foodMod = (game.foodRate - 1.0) / 10;       // +/- слабый эффект
  let birthRate = baseBirthRate + popMod + foodMod;

  // если голод был — рождаемость падает
  if (hungerDeaths > 0) birthRate -= 0.01;

  birthRate = clamp(birthRate, 0, 0.06);           // максимум 6%
  const births = Math.round(total * birthRate);

  if (births > 0) {
    game.classes.peasants += births; // почти все новорождённые в крестьян
    report.push("Родилось: +" + fmt(births));
  }

  // Социальный рост: крестьяне -> горожане (рынки/экономика)
  if (game.markets >= 2) {
    const promotion = Math.round(game.classes.peasants * 0.01); // 1% в год
    if (promotion > 0) {
      game.classes.peasants -= promotion;
      game.classes.burghers += promotion;
      report.push("Социальный рост: +" + fmt(promotion) + " горожан (из крестьян).");
    }
  }

  // Города/замок формируют знать: горожане -> знать
  if (game.castleLevel >= 3) {
    const eliteRise = Math.round(game.classes.burghers * 0.005); // 0.5% в год
    if (eliteRise > 0) {
      game.classes.burghers -= eliteRise;
      game.classes.nobles += eliteRise;
      report.push("Элиты усилились: +" + fmt(eliteRise) + " знати (из горожан).");
    }
  }

  // Миграция
  // Едут при высокой популярности + низких налогах + нет голода
  if (game.popularity >= 70 && game.taxRate <= 10 && hungerDeaths === 0) {
    const immigrants = Math.round(total * 0.01);
    if (immigrants > 0) {
      game.classes.peasants += immigrants;
      report.push("Переселенцы прибыли: +" + fmt(immigrants) + " жителей.");
    }
  }
  // Уезжают при низкой популярности или высоких налогах
  else if (game.popularity <= 25 || game.taxRate >= 25) {
    const emigrants = Math.round(total * 0.012);
    if (emigrants > 0) {
      applyPopulationLoss(emigrants);
      report.push("Эмиграция: -" + fmt(emigrants) + " жителей.");
    }
  }

  // итог
  game.population = getPopTotal();
}

// ======================================================
//                ЭЛИТЫ: ТРЕБОВАНИЯ / ЗАГОВОРЫ
// ======================================================

function applyElitePressure(report) {
  const nobles = game.classes.nobles || 0;

  // Мягкое давление
  if (nobles > 50 && game.castleLevel < 3) {
    game.popularity = clamp(game.popularity - 5, 0, 100);
    report.push("Знать недовольна слабым замком. Популярность -5.");
  }

  // Сильное давление
  if (nobles > 100 && game.castleLevel < 5) {
    game.popularity = clamp(game.popularity - 10, 0, 100);
    report.push("Высшая аристократия угрожает заговором. Популярность -10.");
  }

  // Шанс заговора (если знать сильна, замок слаб)
  if (nobles > 120 && game.castleLevel < 5) {
    const coupChance = clamp((nobles - 120) / 500, 0, 0.25); // до 25%
    if (Math.random() < coupChance) {
      const goldLoss = Math.round(game.gold * 0.35);
      game.gold -= goldLoss;
      game.popularity = clamp(game.popularity - 12, 0, 100);
      report.push("ЗАГОВОР! Часть казны исчезла: -" + fmt(goldLoss) + " золота.");
    }
  }
}

// ======================================================
//           БУНТ ПРИ ПОПУЛЯРНОСТИ < 15
// ======================================================

function applyRevolt(report) {
  if (game.popularity >= 15) return;

  const deficit = 15 - game.popularity; // 1..15
  const revoltChance = clamp(deficit / 20, 0.05, 0.8);

  if (Math.random() < revoltChance) {
    const lossPop = Math.round(game.population * 0.2);
    const lossGold = Math.round(game.gold * 0.4);
    const lossArmy = Math.round(game.army * 0.5);

    applyPopulationLoss(lossPop);
    game.gold = Math.max(0, game.gold - lossGold);
    game.army = Math.max(0, game.army - lossArmy);
    game.popularity = clamp(game.popularity - 8, 0, 100);

    report.push("ВСПЫХНУЛ БУНТ!");
    report.push("Потери населения: -" + fmt(lossPop));
    report.push("Потери золота: -" + fmt(lossGold));
    report.push("Потери армии: -" + fmt(lossArmy));

    // Если после бунта всё совсем плохо — конец
    if (game.popularity <= 5 || game.population < 100) {
      game.gameOver = true;
      report.push("");
      report.push("Власть пала. Игра окончена.");
    }
  }
}

// ======================================================
//      ЭКОНОМИЧЕСКИЙ КОЛЛАПС ПРИ ИНФЛЯЦИИ > 25%
// ======================================================

function applyInflationAndCollapse(report) {
  // База инфляции
  let inflation = 0.01;

  // Денежная масса/казна разгоняет цены
  if (game.gold > 2000) inflation += 0.01;
  if (game.gold > 5000) inflation += 0.02;

  // Налоги тоже давят на рынок
  if (game.taxRate >= 20) inflation += 0.01;
  if (game.taxRate >= 30) inflation += 0.01;

  // Торговля (рынки) ускоряет движение денег
  if (game.markets >= 3) inflation += 0.01;
  if (game.markets >= 7) inflation += 0.01;

  // Ограничим адекватно
  inflation = clamp(inflation, 0, 0.40); // до 40% в год

  // применяем
  game.priceIndex *= (1 + inflation);
  game.inflationRate = Math.round(inflation * 1000) / 10; // % с 1 знаком

  report.push("Инфляция за год: " + game.inflationRate.toFixed(1) + " %");

  // КОЛЛАПС: если годовая инфляция > 25%
  if (game.inflationRate > 25 && game.lastCollapseYear !== game.year) {
    game.lastCollapseYear = game.year;

    report.push("ЭКОНОМИЧЕСКИЙ КОЛЛАПС!");
    const crashLoss = Math.round(game.gold * 0.5);
    game.gold = Math.max(0, game.gold - crashLoss);

    // разорение части горожан -> в крестьяне
    const bankrupt = Math.round((game.classes.burghers || 0) * 0.25);
    game.classes.burghers = Math.max(0, (game.classes.burghers || 0) - bankrupt);
    game.classes.peasants += bankrupt;

    game.popularity = clamp(game.popularity - 15, 0, 100);

    report.push("Потеря золота: -" + fmt(crashLoss));
    report.push("Разорение горожан: -" + fmt(bankrupt) + " (ушли в крестьянство)");
    report.push("Популярность -15");
  }
}

// ======================================================
//                    ХОД ИГРЫ
// ======================================================

function endTurn() {
  if (!ensureNotGameOver()) return;

  // снимем значения из ползунков (если есть)
  const taxSlider = document.getElementById("taxRate");
  const foodSlider = document.getElementById("foodRate");
  if (taxSlider) game.taxRate = clamp(parseInt(taxSlider.value, 10) || 0, 0, 100);
  if (foodSlider) game.foodRate = clamp(parseFloat(foodSlider.value) || 0, 0, 10);

  const startYear = game.year;
  const startPop = game.population;
  const startFood = game.food;
  const startGold = game.gold;
  const startIron = game.iron;
  const startArmy = game.army;
  const startPeasants = game.classes.peasants;
  const startBurghers = game.classes.burghers;
  const startNobles = game.classes.nobles;

  const report = [];
  report.push("Год " + startYear);
  report.push("---------------------------");

  // Производство еды
  const foodProduction = game.farms * 500;
  game.food += foodProduction;
  if (foodProduction > 0) report.push("Фермы произвели: +" + fmt(foodProduction) + " еды");

  // Добыча железа
  const ironProduction = game.mines * 10;
  game.iron += ironProduction;
  if (ironProduction > 0) report.push("Шахты добыли: +" + fmt(ironProduction) + " железа");

  // Доход: налоги + пошлины рынков
  let taxIncome = Math.round(game.population * (game.taxRate / 100));
  taxIncome += game.markets * 20;
  game.gold += taxIncome;
  report.push("Налоги и пошлины: +" + fmt(taxIncome) + " золота");

  // Содержание армии
  const armyCost = Math.round(game.army * 2 * (game.priceIndex || 1));
  let deserters = 0;

  if (armyCost > 0) {
    if (game.gold >= armyCost) {
      game.gold -= armyCost;
      report.push("Содержание армии: -" + fmt(armyCost) + " золота");
    } else {
      const lack = armyCost - game.gold;
      game.gold = 0;
      deserters = Math.min(game.army, Math.ceil(lack / 5));
      game.army -= deserters;
      report.push("Не хватило денег на армию. Дезертиры: " + fmt(deserters));
    }
  }

  // Расход еды
  const requiredFood = Math.round(game.population * game.foodRate);
  let hungerDeaths = 0;

  if (requiredFood <= 0) {
    // игрок поставил 0 — это всегда удар по популярности
    game.popularity = clamp(game.popularity - 6, 0, 100);
    report.push("Рацион 0: народ в ярости. Популярность -6");
  } else if (game.food >= requiredFood) {
    game.food -= requiredFood;
    report.push("Еда роздана: -" + fmt(requiredFood));
  } else {
    const missing = requiredFood - game.food;
    game.food = 0;

    // смертность от голода зависит от нехватки
    hungerDeaths = Math.min(game.population, Math.ceil((missing / Math.max(0.5, game.foodRate)) / 2));
    applyPopulationLoss(hungerDeaths);

    game.popularity = clamp(game.popularity - 12, 0, 100);
    report.push("Голод! Умерло: " + fmt(hungerDeaths) + " жителей. Популярность -12");
  }

  // Политика: налоги и рацион влияют сильнее (чтобы было ощутимо)
  // Налоги
  if (game.taxRate <= 5) game.popularity = clamp(game.popularity + 5, 0, 100);
  if (game.taxRate >= 15) game.popularity = clamp(game.popularity - 3, 0, 100);
  if (game.taxRate >= 25) game.popularity = clamp(game.popularity - 7, 0, 100);
  if (game.taxRate >= 35) game.popularity = clamp(game.popularity - 12, 0, 100);

  // Рацион
  if (game.foodRate < 0.8) game.popularity = clamp(game.popularity - 5, 0, 100);
  if (game.foodRate >= 1.2 && hungerDeaths === 0) game.popularity = clamp(game.popularity + 4, 0, 100);
  if (game.foodRate >= 1.8 && hungerDeaths === 0) game.popularity = clamp(game.popularity + 6, 0, 100);

  // Дезертиры
  if (deserters > 0) game.popularity = clamp(game.popularity - 4, 0, 100);

  // Случайные события
  applyRandomEvents(report);

  // Давление элит
  applyElitePressure(report);

  // Демография (классы, миграция)
  applyDemography(report, hungerDeaths);

  // Бонус от замка (легитимность)
  game.popularity = clamp(game.popularity + game.castleLevel, 0, 100);

  // Инфляция и коллапс
  applyInflationAndCollapse(report);

  // Бунт
  applyRevolt(report);

  // итоги (до перехода года)
  game.population = getPopTotal();

  const popDiff = game.population - startPop;
  const foodDiff = game.food - startFood;
  const goldDiff = game.gold - startGold;
  const ironDiff = game.iron - startIron;
  const armyDiff = game.army - startArmy;

  report.push("");
  report.push("Население: " + fmt(startPop) + " → " + fmt(game.population) +
    " (" + (popDiff >= 0 ? "+" : "") + fmt(popDiff) + ")");

  report.push("Еда:       " + fmt(startFood) + " → " + fmt(game.food) +
    " (" + (foodDiff >= 0 ? "+" : "") + fmt(foodDiff) + ")");

  report.push("Золото:    " + fmt(startGold) + " → " + fmt(game.gold) +
    " (" + (goldDiff >= 0 ? "+" : "") + fmt(goldDiff) + ")");

  report.push("Железо:    " + fmt(startIron) + " → " + fmt(game.iron) +
    " (" + (ironDiff >= 0 ? "+" : "") + fmt(ironDiff) + ")");

  report.push("Армия:     " + fmt(startArmy) + " → " + fmt(game.army) +
    " (" + (armyDiff >= 0 ? "+" : "") + fmt(armyDiff) + ")");

  report.push("Популярность: " + game.popularity + " / 100");

  // классы (чтобы было понятно, что демография реально работает)
  report.push("");
  report.push("СОСЛОВИЯ:");
  report.push("Крестьяне: " + fmt(startPeasants) + " → " + fmt(game.classes.peasants));
  report.push("Горожане:  " + fmt(startBurghers) + " → " + fmt(game.classes.burghers));
  report.push("Знать:     " + fmt(startNobles) + " → " + fmt(game.classes.nobles));

  // Переход года (если не Game Over)
  if (!game.gameOver) game.year += 1;

  // Победа/поражение (основная цель — стать Императором до 1500)
  // Поражение: 1500 наступило и Императором не стал
  // Победа: стал Императором (по требованиям ранга)
  updateRank();

  if (!game.gameOver) {
    if (game.year >= 1500 && game.rankName !== "Император") {
      game.gameOver = true;
      report.push("");
      report.push("1500 год настал. Темный Император вернулся. Вы проиграли.");
    } else if (game.rankName === "Император") {
      game.gameOver = true;
      report.push("");
      report.push("Вы стали Императором! Империя объединена, и Тьма повержена навсегда.");
    }
  }

  saveGame();
  updateUI();
  showReport(report.join("\n"));
}

// ======================================================
//                     СБРОС ИГРЫ
// ======================================================

function resetGame() {
  if (!confirm("Начать новую игру? Текущее сохранение будет удалено.")) return;
  game = createInitialGameState();
  saveGame();
  updateUI();
}

// ======================================================
//         ПОЛЗУНКИ: ПРИВЯЗКА (ВАЖНО!)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  // загрузка/инициализация
  game = loadGame() || createInitialGameState();

  // прячем отчёт при запуске
  const panel = document.getElementById("reportPanel");
  if (panel) panel.classList.add("hidden");

  // привязка ползунков
  const taxSlider = document.getElementById("taxRate");
  const foodSlider = document.getElementById("foodRate");
  const taxValue = document.getElementById("taxValue");
  const foodValue = document.getElementById("foodValue");

  if (taxSlider && taxValue) {
    taxSlider.value = String(game.taxRate);
    taxValue.textContent = String(game.taxRate);

    taxSlider.addEventListener("input", function () {
      game.taxRate = clamp(parseInt(this.value, 10) || 0, 0, 100);
      taxValue.textContent = String(game.taxRate);
      saveGame();
      updateUI();
    });
  }

  if (foodSlider && foodValue) {
    foodSlider.value = String(game.foodRate);
    foodValue.textContent = String(game.foodRate);

    foodSlider.addEventListener("input", function () {
      game.foodRate = clamp(parseFloat(this.value) || 0, 0, 10);
      foodValue.textContent = String(game.foodRate);
      saveGame();
      updateUI();
    });
  }

  updateRank();
  updateUI();
});

// ======================================================
//   Экспорт функций в window (для onclick в HTML)
// ======================================================

window.build = build;
window.upgradeCastle = upgradeCastle;
window.craftWeapon = craftWeapon;
window.hireSoldier = hireSoldier;

window.buyFood = buyFood;
window.sellFood = sellFood;
window.buyIron = buyIron;
window.sellIron = sellIron;

window.endTurn = endTurn;
window.closeReport = closeReport;
window.resetGame = resetGame;

