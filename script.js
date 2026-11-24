const fallbackPackages = [
  {
    id: 1,
    name: "Goa Beach Escape",
    destination: "Goa",
    days: 5,
    price: 18999,
    rating: 4.6,
    category: "Beach",
    emoji: "🏖️",
    colors: ["#ffb347", "#ff6f61"],
    highlights: ["Baga and Calangute beaches", "Sunset cruise", "Old Goa churches"]
  },
  {
    id: 2,
    name: "Manali Snow Retreat",
    destination: "Himachal Pradesh",
    days: 6,
    price: 22999,
    rating: 4.7,
    category: "Mountain",
    emoji: "🏔️",
    colors: ["#7fb2ff", "#4b6cb7"],
    highlights: ["Solang Valley", "Rohtang Pass visit", "Riverside camping"]
  },
  {
    id: 3,
    name: "Jaipur Heritage Trail",
    destination: "Rajasthan",
    days: 4,
    price: 15499,
    rating: 4.5,
    category: "Heritage",
    emoji: "🏰",
    colors: ["#f6a6c1", "#d4568a"],
    highlights: ["Amber Fort", "City Palace", "Local bazaar walk"]
  },
  {
    id: 4,
    name: "Kerala Backwaters",
    destination: "Kerala",
    days: 5,
    price: 24999,
    rating: 4.8,
    category: "Nature",
    emoji: "🛶",
    colors: ["#6fd6a6", "#1f8a70"],
    highlights: ["Alleppey houseboat", "Munnar tea gardens", "Ayurvedic spa"]
  },
  {
    id: 5,
    name: "Leh Ladakh Adventure",
    destination: "Ladakh",
    days: 7,
    price: 34999,
    rating: 4.9,
    category: "Mountain",
    emoji: "🏍️",
    colors: ["#b79cff", "#5a4fcf"],
    highlights: ["Pangong Lake", "Nubra Valley", "Monastery visits"]
  },
  {
    id: 6,
    name: "Andaman Island Escape",
    destination: "Andaman",
    days: 6,
    price: 29999,
    rating: 4.7,
    category: "Beach",
    emoji: "🤿",
    colors: ["#5ad1e6", "#1b7fc4"],
    highlights: ["Radhanagar beach", "Scuba diving", "Cellular Jail light show"]
  }
];

const offers = [
  "Flat 10% off on all beach packages this week",
  "Book 2 mountain trips and get a free travel kit",
  "Heritage tours: kids under 10 travel free",
  "Early bird: save ₹2,000 on bookings made today"
];

const storageKeys = {
  theme: "wandergo-theme",
  selected: "wandergo-selected",
  wishlist: "wandergo-wishlist",
  name: "wandergo-visitor-name",
  recent: "wandergo-recent",
  offerEnd: "wandergo-offer-end"
};

const elements = {
  nameForm: document.getElementById("name-form"),
  nameInput: document.getElementById("visitor-name"),
  greeting: document.getElementById("greeting"),
  themeButton: document.getElementById("theme-button"),
  promoText: document.getElementById("promo-text"),
  countdown: document.getElementById("countdown"),
  search: document.getElementById("search"),
  category: document.getElementById("category"),
  status: document.getElementById("status"),
  grid: document.getElementById("package-grid"),
  selectedPanel: document.getElementById("selected-panel"),
  wishlist: document.getElementById("wishlist"),
  recent: document.getElementById("recent"),
  clearButton: document.getElementById("clear-button"),
  toast: document.getElementById("toast")
};

let allPackages = [];
let selectedId = null;
let wishlistIds = [];
let recentIds = [];
let toastTimer;

function readStorage(store, key, defaultValue) {
  try {
    const raw = store.getItem(key);
    return raw === null ? defaultValue : JSON.parse(raw);
  } catch (error) {
    return defaultValue;
  }
}

function writeStorage(store, key, value) {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch (error) {
    showToast("Storage is not available in this browser.");
  }
}

function formatPrice(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

function findPackage(id) {
  return allPackages.find(function (item) {
    return item.id === Number(id);
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    elements.toast.classList.remove("show");
  }, 2600);
}

function showLoading() {
  elements.status.className = "status";
  elements.status.innerHTML = "<span class='spinner'></span>Loading packages...";
}

function clearStatus() {
  elements.status.className = "status";
  elements.status.textContent = "";
}

function showError(message) {
  elements.status.className = "status error";
  elements.status.textContent = message + " Showing offline packages instead.";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Retry";
  retry.addEventListener("click", reloadPackages);
  elements.status.appendChild(retry);
}

function delay(milliseconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status + ".");
    }
    return await response.json();
  } catch (error) {
    throw new Error("Could not load " + url + ". " + error.message);
  }
}

function loadPackages(onSuccess, onError) {
  delay(700)
    .then(function () {
      return fetchJson("packages.json");
    })
    .then(function (data) {
      if (!Array.isArray(data) || !data.length) {
        throw new Error("The package data is empty or invalid.");
      }
      onSuccess(data);
    })
    .catch(function (error) {
      onError(error);
    });
}

function runSteps(steps, done) {
  let index = 0;
  function next() {
    if (index >= steps.length) {
      done();
      return;
    }
    const step = steps[index];
    index += 1;
    step(next);
  }
  next();
}

function restoreTheme(next) {
  const theme = readStorage(localStorage, storageKeys.theme, "light");
  applyTheme(theme);
  next();
}

function restoreSession(next) {
  wishlistIds = readStorage(localStorage, storageKeys.wishlist, []);
  selectedId = readStorage(localStorage, storageKeys.selected, null);
  recentIds = readStorage(sessionStorage, storageKeys.recent, []);
  const name = readStorage(sessionStorage, storageKeys.name, "");
  showGreeting(name);
  next();
}

function loadData(next) {
  showLoading();
  loadPackages(
    function (data) {
      allPackages = data;
      clearStatus();
      next();
    },
    function (error) {
      allPackages = fallbackPackages;
      showError(error.message);
      next();
    }
  );
}

function renderAll(next) {
  renderPackages();
  renderSelected();
  renderWishlist();
  renderRecent();
  next();
}

function reloadPackages() {
  runSteps([loadData, renderAll], function () {
    showToast("Packages refreshed");
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeButton.textContent = theme === "dark" ? "Light theme" : "Dark theme";
}

function showGreeting(name) {
  elements.greeting.textContent = name ? "Hello, " + name + "!" : "";
}

function renderPackages() {
  const query = elements.search.value.trim().toLowerCase();
  const category = elements.category.value;

  const visible = allPackages.filter(function (item) {
    const matchesText = (item.name + " " + item.destination).toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category === category;
    return matchesText && matchesCategory;
  });

  elements.grid.innerHTML = "";

  if (!visible.length) {
    elements.grid.innerHTML = "<p class='muted'>No packages match your search.</p>";
    return;
  }

  visible.forEach(function (item) {
    const card = document.createElement("article");
    card.className = "card" + (item.id === selectedId ? " selected" : "");

    const image = document.createElement("div");
    image.className = "card-image";
    image.style.background = "linear-gradient(135deg, " + item.colors[0] + ", " + item.colors[1] + ")";
    image.textContent = item.emoji;

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = item.destination + " · " + item.days + " days · " + item.category + " · ★ " + item.rating;

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = formatPrice(item.price) + " per person";

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.textContent = "View details";
    viewButton.dataset.view = item.id;

    const wishButton = document.createElement("button");
    wishButton.type = "button";
    wishButton.className = "secondary";
    wishButton.dataset.wish = item.id;
    const wished = wishlistIds.includes(item.id);
    wishButton.textContent = wished ? "♥" : "♡";
    wishButton.setAttribute("aria-pressed", String(wished));
    wishButton.setAttribute("aria-label", "Toggle wishlist for " + item.name);

    actions.append(viewButton, wishButton);
    body.append(title, meta, price, actions);
    card.append(image, body);
    elements.grid.appendChild(card);
  });
}

function renderSelected() {
  const item = findPackage(selectedId);

  if (!item) {
    elements.selectedPanel.innerHTML = "<p class='muted'>No destination selected yet.</p>";
    return;
  }

  const list = item.highlights
    .map(function (highlight) {
      return "<li>" + highlight + "</li>";
    })
    .join("");

  elements.selectedPanel.innerHTML =
    "<h3>" + item.name + "</h3>" +
    "<p class='meta'>" + item.destination + " · " + item.days + " days · ★ " + item.rating + "</p>" +
    "<ul>" + list + "</ul>" +
    "<p class='price'>" + formatPrice(item.price) + " per person</p>";
}

function renderNameList(listElement, ids, buttonKey, emptyText) {
  listElement.innerHTML = "";
  const items = ids.map(findPackage).filter(Boolean);

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = emptyText;
    listElement.appendChild(empty);
    return;
  }

  items.forEach(function (item) {
    const row = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = item.name;
    row.appendChild(label);

    if (buttonKey) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary";
      remove.textContent = "×";
      remove.dataset[buttonKey] = item.id;
      remove.setAttribute("aria-label", "Remove " + item.name);
      row.appendChild(remove);
    }

    listElement.appendChild(row);
  });
}

function renderWishlist() {
  renderNameList(elements.wishlist, wishlistIds, "unwish", "Your wishlist is empty.");
}

function renderRecent() {
  renderNameList(elements.recent, recentIds, null, "Nothing viewed yet.");
}

function selectPackage(id) {
  selectedId = Number(id);
  writeStorage(localStorage, storageKeys.selected, selectedId);

  recentIds = [selectedId].concat(
    recentIds.filter(function (existing) {
      return existing !== selectedId;
    })
  ).slice(0, 5);
  writeStorage(sessionStorage, storageKeys.recent, recentIds);

  renderPackages();
  renderSelected();
  renderRecent();
}

function toggleWishlist(id) {
  const number = Number(id);
  const item = findPackage(number);

  if (wishlistIds.includes(number)) {
    wishlistIds = wishlistIds.filter(function (existing) {
      return existing !== number;
    });
    showToast(item.name + " removed from wishlist");
  } else {
    wishlistIds.push(number);
    showToast(item.name + " added to wishlist");
  }

  writeStorage(localStorage, storageKeys.wishlist, wishlistIds);
  renderPackages();
  renderWishlist();
}

function startPromoRotation() {
  let index = 0;
  elements.promoText.textContent = offers[index];
  setInterval(function () {
    elements.promoText.classList.add("fading");
    setTimeout(function () {
      index = (index + 1) % offers.length;
      elements.promoText.textContent = offers[index];
      elements.promoText.classList.remove("fading");
    }, 300);
  }, 4000);
}

function startCountdown() {
  let endTime = readStorage(sessionStorage, storageKeys.offerEnd, 0);
  if (!endTime || endTime < Date.now()) {
    endTime = Date.now() + 10 * 60 * 1000;
    writeStorage(sessionStorage, storageKeys.offerEnd, endTime);
  }

  const timerId = setInterval(function () {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = String(Math.floor(remaining / 60000)).padStart(2, "0");
    const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
    elements.countdown.textContent = minutes + ":" + seconds;

    if (remaining === 0) {
      clearInterval(timerId);
      elements.countdown.textContent = "expired";
    }
  }, 1000);
}

elements.grid.addEventListener("click", function (event) {
  const viewId = event.target.dataset.view;
  const wishId = event.target.dataset.wish;

  if (viewId) {
    selectPackage(viewId);
  }
  if (wishId) {
    toggleWishlist(wishId);
  }
});

elements.wishlist.addEventListener("click", function (event) {
  if (event.target.dataset.unwish) {
    toggleWishlist(event.target.dataset.unwish);
  }
});

elements.search.addEventListener("keyup", renderPackages);
elements.category.addEventListener("change", renderPackages);

elements.themeButton.addEventListener("click", function () {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  writeStorage(localStorage, storageKeys.theme, next);
});

elements.nameForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = elements.nameInput.value.trim();
  if (!name) {
    showToast("Please enter your name.");
    return;
  }
  writeStorage(sessionStorage, storageKeys.name, name);
  showGreeting(name);
  elements.nameInput.value = "";
  showToast("Saved for this session only");
});

elements.clearButton.addEventListener("click", function () {
  Object.values(storageKeys).forEach(function (key) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      return;
    }
  });
  selectedId = null;
  wishlistIds = [];
  recentIds = [];
  applyTheme("light");
  showGreeting("");
  renderPackages();
  renderSelected();
  renderWishlist();
  renderRecent();
  showToast("Saved data cleared");
});

startPromoRotation();
startCountdown();

setTimeout(function () {
  showToast("Welcome to WanderGo! Check today's offers above.");
}, 2500);

runSteps([restoreTheme, restoreSession, loadData, renderAll], function () {
  console.log("WanderGo ready with " + allPackages.length + " packages");
});