const STORAGE_KEY = "spese-pwa-locale-v4";

const defaultCategories = [
  "Alimentari",
  "Casa",
  "Trasporti",
  "Bollette",
  "Svago",
  "Salute",
  "Abbonamenti",
  "Altro"
];

const initialState = {
  selectedMonth: getCurrentMonth(),
  selectedReportMonth: getCurrentMonth(),
  categories: [...defaultCategories],
  expenses: [],
  thresholds: {
    totalLimit: 1200,
    categoryLimits: {
      Alimentari: 350,
      Casa: 250,
      Trasporti: 120,
      Bollette: 250,
      Svago: 150,
      Salute: 100,
      Abbonamenti: 80,
      Altro: 100
    }
  }
};

let deferredPrompt = null;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const oldSaved = localStorage.getItem("spese-pwa-locale-v3") || localStorage.getItem("spese-pwa-locale-v2") || localStorage.getItem("spese-pwa-locale-v1");
    if (oldSaved) {
      try {
        const oldState = JSON.parse(oldSaved);
        return migrateState(oldState);
      } catch {
        return structuredClone(initialState);
      }
    }

    return structuredClone(initialState);
  }

  try {
    return migrateState(JSON.parse(saved));
  } catch {
    return structuredClone(initialState);
  }
}

function migrateState(rawState) {
  const migrated = {
    selectedMonth: rawState.selectedMonth || getCurrentMonth(),
    selectedReportMonth: rawState.selectedReportMonth || rawState.selectedMonth || getCurrentMonth(),
    categories: rawState.categories || [...defaultCategories],
    expenses: Array.isArray(rawState.expenses) ? rawState.expenses : [],
    thresholds: rawState.thresholds || structuredClone(initialState.thresholds)
  };

  if (!migrated.thresholds.categoryLimits) {
    migrated.thresholds.categoryLimits = {};
  }

  migrated.categories.forEach(category => {
    if (migrated.thresholds.categoryLimits[category] === undefined) {
      migrated.thresholds.categoryLimits[category] = 0;
    }
  });

  migrated.expenses = migrated.expenses.map(expense => ({
    ...expense,
    month: expense.month || getMonthFromDate(expense.date),
    type: expense.type || "single"
  }));

  return migrated;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function formatCurrency(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getMonthFromDate(date) {
  return date.slice(0, 7);
}

function getTargetYearMonth(dateString, monthsToAdd) {
  const [year, month] = dateString.split("-").map(Number);
  const zeroBasedTargetMonth = month - 1 + monthsToAdd;

  const targetYear = year + Math.floor(zeroBasedTargetMonth / 12);
  const targetMonthIndex = ((zeroBasedTargetMonth % 12) + 12) % 12;
  const targetMonth = targetMonthIndex + 1;

  return {
    year: targetYear,
    month: targetMonth,
    monthKey: `${targetYear}-${String(targetMonth).padStart(2, "0")}`
  };
}

function getInstallmentDate(dateString, monthsToAdd) {
  const [, , originalDay] = dateString.split("-").map(Number);
  const target = getTargetYearMonth(dateString, monthsToAdd);

  const lastDayOfTargetMonth = new Date(target.year, target.month, 0).getDate();
  const safeDay = Math.min(originalDay, lastDayOfTargetMonth);

  return `${target.monthKey}-${String(safeDay).padStart(2, "0")}`;
}


function shiftSelectedMonth(delta) {
  const [year, month] = state.selectedMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  state.selectedMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  saveState();
  renderAll();
}

function getMonthLabel(month) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function getMonthlyExpenses(month = state.selectedMonth) {
  return state.expenses.filter(expense => expense.month === month);
}

function getMonthsWithExpenses() {
  return [...new Set(state.expenses.map(expense => expense.month))]
    .filter(Boolean)
    .sort()
    .reverse();
}

function ensureSelectedReportMonth() {
  const months = getMonthsWithExpenses();

  if (months.length === 0) {
    state.selectedReportMonth = "";
    return;
  }

  if (!state.selectedReportMonth || !months.includes(state.selectedReportMonth)) {
    state.selectedReportMonth = months[0];
  }
}


function getTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

function getTotalsByCategory(expenses) {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {});
}

function getThresholdStatus(spent, limit) {
  if (!limit || limit <= 0) {
    return { label: "Nessuna soglia", className: "warning", percentage: 0 };
  }

  const percentage = (spent / limit) * 100;

  if (percentage >= 100) {
    return { label: "Superata", className: "danger-status", percentage };
  }

  if (percentage >= 90) {
    return { label: "Quasi superata", className: "danger-status", percentage };
  }

  if (percentage >= 70) {
    return { label: "Attenzione", className: "warning", percentage };
  }

  return { label: "OK", className: "ok", percentage };
}

function setDefaultDate() {
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);
}

function renderCategoryOptions() {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = state.categories
    .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function renderDashboard() {
  const month = state.selectedMonth;
  const expenses = getMonthlyExpenses(month);
  const total = getTotal(expenses);
  const limit = Number(state.thresholds.totalLimit || 0);
  const status = getThresholdStatus(total, limit);

  document.getElementById("currentMonthLabel").textContent = getMonthLabel(month);
  document.getElementById("selectedMonthLabel").textContent = getMonthLabel(month);
  document.getElementById("monthlyTotal").textContent = formatCurrency(total);
  document.getElementById("monthlyBudget").textContent = formatCurrency(limit);

  const progress = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
  document.getElementById("monthlyProgressBar").style.width = `${progress}%`;
  document.getElementById("monthlyStatus").textContent =
    limit > 0
      ? `${Math.round(status.percentage)}% del budget utilizzato — ${status.label}`
      : "Imposta un budget mensile nella sezione Soglie";

  renderCriticalCategories(expenses);
  renderLatestExpenses(expenses);
}

function renderCriticalCategories(expenses) {
  const container = document.getElementById("criticalCategories");
  const totalsByCategory = getTotalsByCategory(expenses);

  const critical = state.categories
    .map(category => {
      const spent = totalsByCategory[category] || 0;
      const limit = Number(state.thresholds.categoryLimits[category] || 0);
      const status = getThresholdStatus(spent, limit);
      return { category, spent, limit, status };
    })
    .filter(item => item.status.percentage >= 70)
    .sort((a, b) => b.status.percentage - a.status.percentage);

  if (critical.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna categoria critica.</p>`;
    return;
  }

  container.innerHTML = critical
    .map(item => `
      <div class="report-row">
        <div>
          <strong>${escapeHtml(item.category)}</strong><br>
          <span>${formatCurrency(item.spent)} su ${formatCurrency(item.limit)}</span>
        </div>
        <span class="badge ${item.status.className}">${item.status.label}</span>
      </div>
    `)
    .join("");
}

function renderLatestExpenses(expenses) {
  const container = document.getElementById("latestExpenses");
  const latest = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (latest.length === 0) {
    container.innerHTML = `<p class="empty">Non hai ancora inserito spese questo mese.</p>`;
    return;
  }

  container.innerHTML = latest.map(renderExpenseRow).join("");
}

function renderExpenseRow(expense, showDelete = false) {
  const multiInfo = expense.type === "multi"
    ? `<span><span class="badge info">Quota ${expense.installmentNumber}/${expense.installmentTotal}</span></span>`
    : "";

  return `
    <div class="expense-row">
      <div class="expense-main">
        <strong>${escapeHtml(expense.category)}</strong>
        <span>${expense.date} · ${escapeHtml(expense.paymentMethod)}</span>
        <span>${escapeHtml(expense.description || "Nessuna descrizione")}</span>
        ${multiInfo}
      </div>
      <div>
        <div class="amount">${formatCurrency(expense.amount)}</div>
        ${showDelete ? `<button class="secondary small" onclick="deleteExpense('${expense.id}')">Elimina</button>` : ""}
      </div>
    </div>
  `;
}

function renderExpensesList() {
  const container = document.getElementById("expensesList");
  const expenses = getMonthlyExpenses()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (expenses.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna spesa presente.</p>`;
    return;
  }

  container.innerHTML = expenses
    .map(expense => renderExpenseRow(expense, true))
    .join("");
}

function renderReportMonthSelect() {
  const select = document.getElementById("reportMonthSelect");
  const months = getMonthsWithExpenses();

  if (!select) return;

  ensureSelectedReportMonth();

  if (months.length === 0) {
    select.innerHTML = `<option value="">Nessuna spesa registrata</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = months
    .map(month => `
      <option value="${month}" ${month === state.selectedReportMonth ? "selected" : ""}>
        ${getMonthLabel(month)}
      </option>
    `)
    .join("");
}

function renderReport() {
  renderReportMonthSelect();

  const container = document.getElementById("categoryReport");
  const selectedReportMonth = state.selectedReportMonth;

  if (!selectedReportMonth) {
    container.innerHTML = `<p class="empty">Non ci sono ancora spese registrate.</p>`;
    return;
  }

  const expenses = getMonthlyExpenses(selectedReportMonth);
  const totalsByCategory = getTotalsByCategory(expenses);
  const total = getTotal(expenses);

  if (expenses.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna spesa presente per il mese selezionato.</p>`;
    return;
  }

  const summary = `
    <div class="report-summary">
      <span>Totale ${getMonthLabel(selectedReportMonth)}</span>
      <strong>${formatCurrency(total)}</strong>
    </div>
  `;

  const rows = state.categories
    .filter(category => (totalsByCategory[category] || 0) > 0 || (state.thresholds.categoryLimits[category] || 0) > 0)
    .map(category => {
      const spent = totalsByCategory[category] || 0;
      const limit = Number(state.thresholds.categoryLimits[category] || 0);
      const status = getThresholdStatus(spent, limit);
      const width = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

      return `
        <div class="report-row">
          <div class="report-line">
            <div class="section-title">
              <strong>${escapeHtml(category)}</strong>
              <span class="badge ${status.className}">${status.label}</span>
            </div>
            <span>${formatCurrency(spent)} su ${formatCurrency(limit)}</span>
            <div class="report-bar">
              <div style="width: ${width}%"></div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = summary + rows;
}

function renderThresholdForm() {
  document.getElementById("totalLimit").value = state.thresholds.totalLimit || "";

  const container = document.getElementById("categoryLimitsForm");
  container.innerHTML = state.categories
    .map(category => `
      <label>
        Soglia ${escapeHtml(category)}
        <input 
          type="number" 
          step="0.01" 
          min="0" 
          data-category-limit="${escapeHtml(category)}" 
          value="${state.thresholds.categoryLimits[category] || ""}" 
        />
      </label>
    `)
    .join("");
}

function renderCategoriesList() {
  const container = document.getElementById("categoriesList");

  if (state.categories.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna categoria presente.</p>`;
    return;
  }

  container.innerHTML = state.categories.map(category => {
    const used = state.expenses.some(expense => expense.category === category);

    return `
      <div class="category-row">
        <input class="category-name-input" value="${escapeHtml(category)}" data-category-old-name="${escapeHtml(category)}" />
        <div class="category-actions">
          <button class="secondary small" onclick="renameCategory('${escapeAttribute(category)}')">Salva</button>
          <button class="danger small" onclick="deleteCategory('${escapeAttribute(category)}')" ${used ? "title='Categoria usata da alcune spese'" : ""}>Elimina</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderAll() {
  renderCategoryOptions();
  renderDashboard();
  renderExpensesList();
  renderReport();
  renderThresholdForm();
  renderCategoriesList();
}

function addExpense(event) {
  event.preventDefault();

  const totalAmount = Number(document.getElementById("amount").value);
  const date = document.getElementById("date").value;
  const isMultiMonth = document.getElementById("isMultiMonth").checked;
  const numberOfMonths = Number(document.getElementById("numberOfMonths").value || 1);
  const category = document.getElementById("category").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const description = document.getElementById("description").value.trim();

  if (!isMultiMonth) {
    state.expenses.push({
      id: crypto.randomUUID(),
      amount: roundToTwoDecimals(totalAmount),
      category,
      date,
      month: getMonthFromDate(date),
      paymentMethod,
      description,
      type: "single"
    });
  } else {
    if (numberOfMonths < 2) {
      alert("Per una spesa plurimensile indica almeno 2 mesi.");
      return;
    }

    const groupId = crypto.randomUUID();
    const baseAmount = Math.floor((totalAmount / numberOfMonths) * 100) / 100;
    const amounts = Array(numberOfMonths).fill(baseAmount);
    const remainder = roundToTwoDecimals(totalAmount - baseAmount * numberOfMonths);
    amounts[numberOfMonths - 1] = roundToTwoDecimals(amounts[numberOfMonths - 1] + remainder);

    for (let i = 0; i < numberOfMonths; i++) {
      const installmentTarget = getTargetYearMonth(date, i);
      const installmentDate = getInstallmentDate(date, i);

      state.expenses.push({
        id: crypto.randomUUID(),
        groupId,
        amount: amounts[i],
        originalAmount: totalAmount,
        category,
        date: installmentDate,
        month: installmentTarget.monthKey,
        paymentMethod,
        description: description || `Spesa plurimensile`,
        type: "multi",
        installmentNumber: i + 1,
        installmentTotal: numberOfMonths
      });
    }
  }

  saveState();

  event.target.reset();
  setDefaultDate();
  document.getElementById("multiMonthOptions").classList.add("hidden");
  showView("dashboardView");
  renderAll();
}

function deleteExpense(id) {
  const expense = state.expenses.find(item => item.id === id);

  if (expense && expense.type === "multi") {
    const deleteAll = confirm("Questa è una quota di una spesa plurimensile. Vuoi eliminare tutte le quote collegate?");
    if (deleteAll && expense.groupId) {
      state.expenses = state.expenses.filter(item => item.groupId !== expense.groupId);
    } else {
      state.expenses = state.expenses.filter(item => item.id !== id);
    }
  } else {
    state.expenses = state.expenses.filter(expense => expense.id !== id);
  }

  saveState();
  renderAll();
}

function saveThresholds(event) {
  event.preventDefault();

  state.thresholds.totalLimit = Number(document.getElementById("totalLimit").value || 0);

  document.querySelectorAll("[data-category-limit]").forEach(input => {
    const category = input.dataset.categoryLimit;
    state.thresholds.categoryLimits[category] = Number(input.value || 0);
  });

  saveState();
  showView("dashboardView");
  renderAll();
}

function addCategory(event) {
  event.preventDefault();

  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();

  if (!name) {
    alert("Inserisci il nome della categoria.");
    return;
  }

  if (state.categories.some(category => category.toLowerCase() === name.toLowerCase())) {
    alert("Questa categoria esiste già.");
    return;
  }

  state.categories.push(name);
  state.thresholds.categoryLimits[name] = 0;
  input.value = "";

  saveState();
  renderAll();
}

function renameCategory(oldName) {
  const input = document.querySelector(`[data-category-old-name="${cssEscape(oldName)}"]`);
  if (!input) return;

  const newName = input.value.trim();

  if (!newName) {
    alert("Il nome della categoria non può essere vuoto.");
    renderAll();
    return;
  }

  if (newName !== oldName && state.categories.some(category => category.toLowerCase() === newName.toLowerCase())) {
    alert("Esiste già una categoria con questo nome.");
    renderAll();
    return;
  }

  state.categories = state.categories.map(category => category === oldName ? newName : category);

  state.expenses = state.expenses.map(expense => ({
    ...expense,
    category: expense.category === oldName ? newName : expense.category
  }));

  state.thresholds.categoryLimits[newName] = state.thresholds.categoryLimits[oldName] || 0;

  if (newName !== oldName) {
    delete state.thresholds.categoryLimits[oldName];
  }

  saveState();
  renderAll();
}

function deleteCategory(categoryName) {
  const used = state.expenses.some(expense => expense.category === categoryName);

  if (used) {
    alert("Non puoi eliminare una categoria già usata da una o più spese. Puoi però rinominarla.");
    return;
  }

  const confirmed = confirm(`Vuoi eliminare la categoria "${categoryName}"?`);
  if (!confirmed) return;

  state.categories = state.categories.filter(category => category !== categoryName);
  delete state.thresholds.categoryLimits[categoryName];

  saveState();
  renderAll();
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(view => {
    view.classList.remove("active");
  });

  document.getElementById(viewId).classList.add("active");

  document.querySelectorAll(".bottom-nav button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });
}

function exportCsv() {
  const expenses = getMonthlyExpenses();

  if (expenses.length === 0) {
    alert("Non ci sono spese da esportare.");
    return;
  }

  const header = [
    "Data",
    "Mese",
    "Categoria",
    "Metodo pagamento",
    "Descrizione",
    "Importo",
    "Tipo",
    "Quota"
  ];

  const rows = expenses.map(expense => [
    expense.date,
    expense.month,
    expense.category,
    expense.paymentMethod,
    expense.description,
    expense.amount,
    expense.type === "multi" ? "Plurimensile" : "Singola",
    expense.type === "multi" ? `${expense.installmentNumber}/${expense.installmentTotal}` : ""
  ]);

  const csv = [header, ...rows]
    .map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `spese-${state.selectedMonth}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}


function exportJsonBackup() {
  const backup = {
    app: "spese-pwa-locale",
    version: 3,
    exportedAt: new Date().toISOString(),
    data: state
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-spese-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function importJsonBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed.data || parsed;

      if (!importedState || !Array.isArray(importedState.expenses)) {
        alert("Il file selezionato non sembra essere un backup valido.");
        event.target.value = "";
        return;
      }

      const confirmed = confirm(
        "Vuoi importare questo backup? I dati attuali verranno sostituiti."
      );

      if (!confirmed) {
        event.target.value = "";
        return;
      }

      state = migrateState(importedState);
      saveState();
      event.target.value = "";
      renderAll();
      showView("dashboardView");
      alert("Backup importato correttamente.");
    } catch {
      alert("Non riesco a leggere il file JSON selezionato.");
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

function resetData() {
  const confirmed = confirm("Vuoi davvero cancellare tutte le spese, soglie e categorie?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(initialState);
  renderAll();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

function roundToTwoDecimals(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}

function cssEscape(value) {
  if (window.CSS && CSS.escape) {
    return CSS.escape(value);
  }

  return String(value).replaceAll('"', '\\"');
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  document.getElementById("installButton").classList.remove("hidden");
});

document.getElementById("installButton").addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installButton").classList.add("hidden");
});

document.querySelectorAll(".bottom-nav button").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

document.getElementById("expenseForm").addEventListener("submit", addExpense);
document.getElementById("thresholdForm").addEventListener("submit", saveThresholds);
document.getElementById("categoryForm").addEventListener("submit", addCategory);
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);
document.getElementById("resetDataButton").addEventListener("click", resetData);
document.getElementById("exportJsonButton").addEventListener("click", exportJsonBackup);
document.getElementById("importJsonInput").addEventListener("change", importJsonBackup);
document.getElementById("reportMonthSelect").addEventListener("change", event => {
  state.selectedReportMonth = event.target.value;
  saveState();
  renderReport();
});
document.getElementById("prevMonthButton").addEventListener("click", () => shiftSelectedMonth(-1));
document.getElementById("nextMonthButton").addEventListener("click", () => shiftSelectedMonth(1));

document.getElementById("isMultiMonth").addEventListener("change", event => {
  document.getElementById("multiMonthOptions").classList.toggle("hidden", !event.target.checked);
});

document.getElementById("appVersion").textContent = APP_VERSION;
setDefaultDate();
renderAll();
registerServiceWorker();
