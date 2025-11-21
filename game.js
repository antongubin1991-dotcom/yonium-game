// ======================================================
//                НАЧАЛЬНЫЕ ДАННЫЕ ИГРЫ
// ======================================================

const STORAGE_KEY = "dark_empire_state_v1";

const RANKS = [
  { name: "Крестьянин",  minPopulation: 0,    minPopularity: 0,  minCastle: 0 },
  { name: "Барон",       minPopulation: 800,  minPopularity: 30, minCastle: 1 },
  { name: "Граф",        minPopulation: 1500, minPopularity: 45, minCastle: 2 },
  { name: "Герцог",      minPopulation: 3000, minPopularity: 60, minCastle: 3 },
  { name: "Король",      minPopulation: 5000, minPopularity: 75, minCastle: 4 },
  { name: "Владыка Тьмы",minPopulation: 8000, minPopularity: 85, minCastle: 5 }
];

let game = null;

// Создание нового состояния
function createInitialGameState() {
  return {
    year: 1450,

    population: 1000,
    food: 5000,
    gold: 1000,
    iron: 0,
    weapons: 0,
    army: 0,

    popularity: 60,
    castleLevel: 0,

    farms: 0,
    mines: 0,
    markets: 0,
    forges: 0,

    taxRate: 10,   // % с населения
    foodRate: 1.0  // ед. еды на 1 жителя
  };
}

// Загрузка / сохранение
function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Object.assign(createInitialGameState(), parsed);
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

// Вспомогательные функции
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fmt(n) {
  return n.toLocaleString("ru-RU");
}

// ======================================================
//                 ОБНОВЛЕНИЕ ЗВАНИЯ
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

// ======================================================
//                ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ======================================================

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

function readRatesFromInputs() {
  const taxInput = document.getElementById("taxRate");
  const foodInput = document.getElementById("foodRate");

  if (taxInput) {
    const v = parseInt(taxInput.value, 10);
    if (!isNaN(v)) game.taxRate = clamp(v, 0, 50);
  }

  if (foodInput) {
    const v = parseFloat(foodInput.value);
    if (!isNaN(v)) game.foodRate = clamp(v, 0.5, 3);
  }
}

function writeRatesToInputs() {
  const taxInput = document.getElementById("taxRate");
  const foodInput = document.getElementById("foodRate");

  if (taxInput) taxInput.value = game.taxRate;
  if (foodInput) foodInput.value = game.foodRate;
}

function updateStatsUI() {
  const yearLabel = document.getElementById("yearLabel");
  if (yearLabel) {
    yearLabel.textContent = "Год: " + game.year;
  }

  setText("pop",        fmt(game.population));
  setText("food",       fmt(game.food));
  setText("gold",       fmt(game.gold));
  setText("iron",       fmt(game.iron));
  setText("weapons",    fmt(game.weapons));
  setText("army",       fmt(game.army));
  setText("popularity", game.popularity + " / 100");
  setText("castle",     "Уровень " + game.castleLevel);
  setText("rank",       game.rankName || "");
}

function updateAdvisor() {
  const el = document.getElementById("advisor");
  if (!el) return;

  const {
    food,
    gold,
    population,
    popularity,
    farms,
    mines,
    markets,
    forges,
    army,
    castleLevel,
    taxRate,
    year
  } = game;

  let msg = "";
  const yearlyFoodNeed = Math.round(population * game.foodRate);

  // --- КАТАСТРОФЫ ---

  if (population < 150) {
    msg = "Господин, подданных так мало, что мы уже почти не Империя, а семейный подряд. Пара неудачных решений — и вы сможете править лично каждым.";
  } else if (popularity <= 10) {
    msg = "Народ вас любит... в смысле, любит мечтать о том, как вы случайно выпадете из башни. Налоги стоит снизить, иначе вас снизят с трона.";
  } else if (food < yearlyFoodNeed * 0.3) {
    msg = "Запасы еды такие, что даже крысы начинают писать завещания. Постройте фермы или готовьтесь к натуральной диете: «минус несколько тысяч жителей».";
  } else if (gold <= 0 && army > 0) {
    msg = "Казна пуста, а армия ещё нет. Если так пойдёт и дальше, солдаты начнут искать золото у ближайшего правителя. То есть у вас — в карманах.";
  }

  // --- ДЕНЬГИ И НАЛОГИ ---

  else if (gold < 50 && taxRate <= 5) {
    msg = "Казна звенит... эхом. Налоги низкие, народ счастлив, а казначей тихо плачет в подвале. Поднимите сборы или начните продавать сувениры с изображением замка.";
  } else if (gold < 100 && taxRate > 20) {
    msg = "Налоги высокие, золота мало. Похоже, кто-то по дороге до казны очень любит считать деньги… и перестаёт считать на мешок раньше.";
  }

  // --- АРМИЯ И ЗАЩИТА ---

  else if (army === 0 && (castleLevel > 0 || year > 1455)) {
    msg = "У нас есть замок, но нет армии. Вы, конечно, можете встретить врага личным обаянием, но я бы всё же нанял пару солдат, для вида.";
  } else if (army > 0 && army < population * 0.02) {
    msg = "Армия есть, но если население решит выйти на прогулку с вилами, солдаты смогут разве что культурно проводить их до тронного зала.";
  }

  // --- ЭКОНОМИКА И РАЗВИТИЕ ---

  else if (farms === 0 && mines === 0) {
    msg = "Ни ферм, ни шахт. Зато отличные перспективы: мы можем обанкротиться ещё до того, как появится первый враг.";
  } else if (farms === 0) {
    msg = "Без ферм мы скоро перейдём на инновационный режим питания: «вчерашние подданные». Постройте хотя бы одну, пока есть кого кормить.";
  } else if (mines === 0 && forges > 0) {
    msg = "Кузницы есть, а железа нет. Мастера уже научились ковать мечи из отчаяния, но оно плохо держит заточку.";
  } else if (mines > 0 && forges === 0) {
    msg = "Железо есть, кузниц нет. Мы официально стали крупнейшим коллекционером бесполезных руд на континенте.";
  } else if (markets === 0 && gold < 500) {
    msg = "Рынков нет, торговля спит. Даже шарлатаны не могут продать эликсир бессмертия — хотя бы казначей бы купил.";
  }

  // --- БЛИЗКАЯ ПОБЕДА / СТАБИЛЬНОСТЬ ---

  else if (castleLevel >= 4 && popularity > 80 && population > 5000) {
    msg = "Империя богата, народ вас боится и почти любит. Ещё немного — и вас можно официально переименовать в «Владыку Тьмы (но с человеческим лицом)».";
  } else if (popularity >= 70 && food > yearlyFoodNeed * 1.5 && gold > 1500) {
    msg = "Редкий случай: все сыты, богаты и почти не планируют переворот. Предлагаю наслаждаться моментом — обычно он длится один-два года.";
  } else {
    msg = "Империя развивается стабильно. Продолжайте аккуратно крутить налоги и рационы, и, возможно, вы умрёте не от вил, а от старости. Для нашего региона это успех.";
  }

  el.textContent = msg;
}
function updateUI() {
  updateRank();
  writeRatesToInputs();
  updateStatsUI();
  updateAdvisor();
}

// ======================================================
//                  ОКНО ОТЧЁТА
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
//                     ДЕЙСТВИЯ
// ======================================================

function build(type) {
  let cost = 0;
  let label = "";

  switch (type) {
    case "farm":
      cost = 100;
      label = "ферму";
      if (game.gold < cost) return alert("Недостаточно золота для постройки фермы.");
      game.gold -= cost;
      game.farms += 1;
      break;
    case "mine":
      cost = 200;
      label = "шахту";
      if (game.gold < cost) return alert("Недостаточно золота для постройки шахты.");
      game.gold -= cost;
      game.mines += 1;
      break;
    case "market":
      cost = 300;
      label = "рынок";
      if (game.gold < cost) return alert("Недостаточно золота для постройки рынка.");
      game.gold -= cost;
      game.markets += 1;
      break;
    case "forge":
      cost = 150;
      label = "кузницу";
      if (game.gold < cost) return alert("Недостаточно золота для постройки кузницы.");
      game.gold -= cost;
      game.forges += 1;
      break;
    default:
      return;
  }

  game.popularity = clamp(game.popularity + 1, 0, 100);
  saveGame();
  updateUI();
  console.log("Построено: " + label);
}

function upgradeCastle() {
  const nextLevel = game.castleLevel + 1;
  const cost = 500 * nextLevel;

  if (game.gold < cost) {
    return alert("Недостаточно золота. Нужно " + cost + " золота для улучшения замка.");
  }

  game.gold -= cost;
  game.castleLevel = nextLevel;
  game.popularity = clamp(game.popularity + 3, 0, 100);

  saveGame();
  updateUI();
  alert("Замок улучшен до уровня " + nextLevel + "!");
}

function craftWeapon() {
  if (game.iron <= 0) {
    return alert("Нет железа для ковки оружия.");
  }
  const amount = Math.min(game.iron, 10); // до 10 за раз
  game.iron -= amount;
  game.weapons += amount;

  saveGame();
  updateUI();
}

function hireSoldier() {
  if (game.weapons < 1) {
    return alert("Недостаточно оружия для найма солдата.");
  }
  if (game.gold < 50) {
    return alert("Нужно 50 золота для найма солдата.");
  }

  game.weapons -= 1;
  game.gold -= 50;
  game.army += 1;
  game.popularity = clamp(game.popularity - 1, 0, 100);

  saveGame();
  updateUI();
}

// ======================================================
//                    ХОД ИГРЫ
// ======================================================

function endTurn() {
  // применяем текущие значения из инпутов
  readRatesFromInputs();

  const startYear = game.year;
  const startPop = game.population;
  const startFood = game.food;
  const startGold = game.gold;
  const startIron = game.iron;
  const startArmy = game.army;

  let report = [];
  report.push("Год " + startYear);
  report.push("---------------------------");

  // Производство еды фермами
  const foodProduction = game.farms * 500;
  game.food += foodProduction;
  if (foodProduction > 0) {
    report.push("Фермы произвели еды: +" + fmt(foodProduction));
  }

  // Добыча железа шахтами
  const ironProduction = game.mines * 10;
  game.iron += ironProduction;
  if (ironProduction > 0) {
    report.push("Шахты добыли железа: +" + fmt(ironProduction));
  }

  // Доход от налогов и рынков
  let taxIncome = Math.round(game.population * (game.taxRate / 100));
  const marketBonus = game.markets * 20;
  taxIncome += marketBonus;
  game.gold += taxIncome;
  report.push("Собрано налогов и пошлин: +" + fmt(taxIncome) + " золота");

  // Содержание армии
  const armyCost = game.army * 2;
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
      report.push("Не хватило золота на армию. Дезертировало солдат: " + fmt(deserters));
    }
  }

  // Расход еды
  const requiredFood = Math.round(game.population * game.foodRate);
  let hungerDeaths = 0;

  if (game.food >= requiredFood) {
    game.food -= requiredFood;
    report.push("Пища роздана народу: -" + fmt(requiredFood) + " еды");
  } else {
    const missing = requiredFood - game.food;
    game.food = 0;
    hungerDeaths = Math.min(game.population, Math.ceil(missing / game.foodRate / 2));
    game.population -= hungerDeaths;
    report.push("Не хватило еды! Умерло от голода: " + fmt(hungerDeaths) + " жителей");
  }

  // Прирост населения
  const births = Math.round(startPop * 0.02);
  game.population += births;

  // Популярность
  if (hungerDeaths > 0) {
    game.popularity -= 10;
  } else if (requiredFood > 0 && game.foodRate > 1.2) {
    game.popularity += 2;
  }

  if (game.taxRate <= 5) {
    game.popularity += 3;
  } else if (game.taxRate >= 20) {
    game.popularity -= 5;
  }

  if (deserters > 0) {
    game.popularity -= 4;
  }

  // Бонус за развитие замка
  game.popularity += game.castleLevel;
  game.popularity = clamp(game.popularity, 0, 100);

  // Итоговые строки в отчёте
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
  report.push("");

  // Переход к следующему году
  game.year += 1;

  // Проверка победы / поражения (очень простая)
  let ending = "";
  if (game.popularity <= 0 || game.population < 100) {
    ending = "Народ поднял восстание, ваша власть пала. Игра окончена.";
  } else if (
    game.year >= 1500 &&
    game.castleLevel >= 4 &&
    game.population >= 5000 &&
    game.popularity >= 80
  ) {
    ending = "Империя процветает, народ вас боится и уважает. Вас провозгласили Владыкой Тьмы!";
  }

  if (ending) {
    report.push(ending);
  }

  saveGame();
  updateUI();
  showReport(report.join("\n"));

  if (ending) {
    // можно автоматически сбросить игру после отчёта
    // но лучше дать игроку самому нажать "Сбросить игру"
  }
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
//                         СТАРТ
// ======================================================

(function init() {
    game = loadGame() || createInitialGameState();

    // На всякий случай всегда прячем окно отчёта при загрузке
    const panel = document.getElementById("reportPanel");
    if (panel) panel.classList.add("hidden");

    updateRank();
    updateUI();
})();

