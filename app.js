// ===== CONFIG =====
const PRESETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvKk4L7G0ZMWnuv_io7YTdjTY4zq2JNdoiqbJCO96yglhumRv5BVJE2IQ7l3twZPGGW39kvJwoMcP1/pub?gid=0&single=true&output=csv';
const DISHES_URL  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvKk4L7G0ZMWnuv_io7YTdjTY4zq2JNdoiqbJCO96yglhumRv5BVJE2IQ7l3twZPGGW39kvJwoMcP1/pub?gid=1712157904&single=true&output=csv';

const ALL_CATEGORIES = ['vegetable', 'meat', 'side', 'soup', 'one-pot'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ===== STATE =====
let presetsByDay = {};
let dishesByCategory = {};
let selectedCategories = [];
let chosenDishes = {};

// ===== DOM =====
const daySelect = document.getElementById('daySelect');
const categoryCheckboxes = document.getElementById('categoryCheckboxes');
const dishSelectors = document.getElementById('dishSelectors');
const magicBtn = document.getElementById('magicBtn');

// ===== DAYS HELPER =====
function getTodayName() {
  const todayIndex = new Date().getDay(); // 0 = Sunday
  return todayIndex === 0 ? 'Sunday' : DAYS[todayIndex - 1];
}

// ===== INIT =====
init();

async function init() {
  populateDays();
  presetsByDay = await loadPresets();
  dishesByCategory = await loadDishes();

  daySelect.addEventListener('change', onDayChange);
  magicBtn.addEventListener('click', magicPick);

  daySelect.value = getTodayName();
  onDayChange();
}

// ===== LOAD DATA =====
async function fetchWithFallback(url, storageKey) {
  try {
    const res = await fetch(`${url}&t=${Date.now()}`);
    const text = await res.text();
    localStorage.setItem(storageKey, text);
    return text;
  } catch (err) {
    const cached = localStorage.getItem(storageKey);
    if (cached) return cached;
    throw err;
  }
}
  

async function loadPresets() {
  const text = await fetchWithFallback(
    PRESETS_URL,
    'mealplanner_presets_csv'
  );

  const rows = text.trim().split('\n').slice(1);
  const map = {};

  rows.forEach(row => {
    const parts = row.split(',');
    const day = parts[0].trim();
    const categoriesRaw = parts.slice(1).join(',').trim();

    map[day] = categoriesRaw
    .split('|')
    .map(c => c.trim());
  });

  return map;
}
  

async function loadDishes() {
  const text = await fetchWithFallback(
    DISHES_URL,
    'mealplanner_dishes_csv'
  );
  const rows = text.trim().split('\n').slice(1);
  const map = {};

  rows.forEach(row => {
    const parts = row.split(',');
    const category = parts[0].trim();
    const dish = parts.slice(1).join(',').trim();

    if (!map[category]) map[category] = [];
    map[category].push(dish);
  });

  return map;
}
  

// ===== UI =====
function populateDays() {
  DAYS.forEach(day => {
    const opt = document.createElement('option');
    opt.value = day;
    opt.textContent = day;
    daySelect.appendChild(opt);
  });
}

function onDayChange() {
  console.log('Selected day:', daySelect.value);
  console.log('Categories:', presetsByDay[daySelect.value]);
  selectedCategories = presetsByDay[daySelect.value] || [];
  chosenDishes = {};
  renderCategories();
  renderDishes();
}

function renderCategories() {
  categoryCheckboxes.innerHTML = '';

  ALL_CATEGORIES.forEach(cat => {
    const label = document.createElement('label');
    label.className = 'category-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = selectedCategories.includes(cat);
    cb.addEventListener('change', () => toggleCategory(cat));

    label.appendChild(cb);
    label.append(` ${cat}`);
    categoryCheckboxes.appendChild(label);
  });
}

function toggleCategory(cat) {
  if (selectedCategories.includes(cat)) {
    selectedCategories = selectedCategories.filter(c => c !== cat);
    delete chosenDishes[cat];
  } else {
    selectedCategories.push(cat);
  }
  renderDishes();
}

function renderDishes() {
  dishSelectors.innerHTML = '';

  ALL_CATEGORIES
    .filter(cat => selectedCategories.includes(cat))
    .forEach(cat => {
    const wrapper = document.createElement('div');
    wrapper.className = 'dish-group'
    
    const title = document.createElement('h3');
    title.textContent = cat;
    wrapper.appendChild(title);

    const select = document.createElement('select');
    select.dataset.category = cat;
    select.innerHTML = `<option value="">-- choose --</option>`;

    (dishesByCategory[cat] || []).forEach(dish => {
        const opt = document.createElement('option');
        opt.value = dish;
        opt.textContent = dish;
        select.appendChild(opt);
    });

    select.value = chosenDishes[cat] || '';
    select.addEventListener('change', e => {
        chosenDishes[cat] = e.target.value;
    });

    wrapper.appendChild(select);
    dishSelectors.appendChild(wrapper);
    });
}
  

// ===== MAGIC =====
function magicPick() {
  selectedCategories.forEach(cat => {
    const dishes = dishesByCategory[cat];
    if (!dishes || dishes.length === 0) return;

    const randIndex = Math.floor(Math.random() * dishes.length);
    const dish = dishes[randIndex];
    chosenDishes[cat] = dish;

    const select = document.querySelector(
    `select[data-category="${cat}"]`
    );

    if (select) {
    select.classList.remove('magic-animate');
    void select.offsetWidth;
    select.classList.add('magic-animate');

    setTimeout(() => {
        select.selectedIndex = randIndex + 1; // +1 for "-- choose --"
    }, 120);
    }
  });
}
  
