const STORAGE_KEY = "spese-pwa-locale-v45";
const APP_VERSION = "V.45";

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
  selectedExpensesMonth: getCurrentMonth(),
  selectedExpensesDateFrom: getMonthStartDate(getCurrentMonth()),
  selectedExpensesDateTo: getMonthEndDate(getCurrentMonth()),
  selectedExpenseCategories: [],
  selectedExpenseDescriptionSearch: "",
  selectedReportMonth: getCurrentMonth(),
  selectedMultiReportReferenceMonth: getCurrentMonth(),
  selectedMultiReportMonthsBefore: 0,
  selectedMultiReportMonthsAfter: 0,
  selectedMultiReportCategories: [],
  categories: [...defaultCategories],
  expenses: [],
  reimbursements: [],
  thresholds: {
    totalLimit: 1400,
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
let editingExpenseId = null;
let editingReimbursementId = null;
let reimbursementSourceExpenseId = null;

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const oldSaved = localStorage.getItem("spese-pwa-locale-v44") || localStorage.getItem("spese-pwa-locale-v43") || localStorage.getItem("spese-pwa-locale-v42") || localStorage.getItem("spese-pwa-locale-v41") || localStorage.getItem("spese-pwa-locale-v40") || localStorage.getItem("spese-pwa-locale-v39") || localStorage.getItem("spese-pwa-locale-v38") || localStorage.getItem("spese-pwa-locale-v37") || localStorage.getItem("spese-pwa-locale-v36") || localStorage.getItem("spese-pwa-locale-v35") || localStorage.getItem("spese-pwa-locale-v34") || localStorage.getItem("spese-pwa-locale-v33") || localStorage.getItem("spese-pwa-locale-v32") || localStorage.getItem("spese-pwa-locale-v31") || localStorage.getItem("spese-pwa-locale-v30") || localStorage.getItem("spese-pwa-locale-v29") || localStorage.getItem("spese-pwa-locale-v28") || localStorage.getItem("spese-pwa-locale-v27") || localStorage.getItem("spese-pwa-locale-v26") || localStorage.getItem("spese-pwa-locale-v25") || localStorage.getItem("spese-pwa-locale-v24") || localStorage.getItem("spese-pwa-locale-v23") || localStorage.getItem("spese-pwa-locale-v22") || localStorage.getItem("spese-pwa-locale-v21") || localStorage.getItem("spese-pwa-locale-v20") || localStorage.getItem("spese-pwa-locale-v19") || localStorage.getItem("spese-pwa-locale-v18") || localStorage.getItem("spese-pwa-locale-v17") || localStorage.getItem("spese-pwa-locale-v16") || localStorage.getItem("spese-pwa-locale-v15") || localStorage.getItem("spese-pwa-locale-v14") || localStorage.getItem("spese-pwa-locale-v13") || localStorage.getItem("spese-pwa-locale-v12") || localStorage.getItem("spese-pwa-locale-v11") || localStorage.getItem("spese-pwa-locale-v10") || localStorage.getItem("spese-pwa-locale-v9") || localStorage.getItem("spese-pwa-locale-v8") || localStorage.getItem("spese-pwa-locale-v7") || localStorage.getItem("spese-pwa-locale-v6") || localStorage.getItem("spese-pwa-locale-v5") || localStorage.getItem("spese-pwa-locale-v4") || localStorage.getItem("spese-pwa-locale-v3") || localStorage.getItem("spese-pwa-locale-v2") || localStorage.getItem("spese-pwa-locale-v1");
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
    selectedExpensesMonth: rawState.selectedExpensesMonth || rawState.selectedMonth || getCurrentMonth(),
    selectedExpensesDateFrom: rawState.selectedExpensesDateFrom || getMonthStartDate(rawState.selectedExpensesMonth || rawState.selectedMonth || getCurrentMonth()),
    selectedExpensesDateTo: rawState.selectedExpensesDateTo || getMonthEndDate(rawState.selectedExpensesMonth || rawState.selectedMonth || getCurrentMonth()),
    selectedExpenseCategories: Array.isArray(rawState.selectedExpenseCategories) ? rawState.selectedExpenseCategories : [],
    selectedExpenseDescriptionSearch: rawState.selectedExpenseDescriptionSearch || "",
    selectedReportMonth: rawState.selectedReportMonth || rawState.selectedMonth || getCurrentMonth(),
    selectedMultiReportReferenceMonth: rawState.selectedMultiReportReferenceMonth || getCurrentMonth(),
    selectedMultiReportMonthsBefore: Number(rawState.selectedMultiReportMonthsBefore || 0),
    selectedMultiReportMonthsAfter: Number(rawState.selectedMultiReportMonthsAfter || 0),
    selectedMultiReportCategories: Array.isArray(rawState.selectedMultiReportCategories) ? rawState.selectedMultiReportCategories : [],
    categories: rawState.categories || [...defaultCategories],
    expenses: Array.isArray(rawState.expenses) ? rawState.expenses : [],
    reimbursements: Array.isArray(rawState.reimbursements) ? rawState.reimbursements : [],
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

  migrated.reimbursements = migrated.reimbursements.map(reimbursement => ({
    id: reimbursement.id || createId(),
    amount: roundToTwoDecimals(Number(reimbursement.amount || 0)),
    category: reimbursement.category || "Altro",
    date: reimbursement.date || getTodayDateString(),
    month: reimbursement.month || getMonthFromDate(reimbursement.date || getTodayDateString()),
    description: reimbursement.description || ""
  })).filter(reimbursement => reimbursement.amount > 0);

  migrated.thresholds.totalLimit = migrated.categories.reduce((sum, category) => {
    return sum + Number(migrated.thresholds.categoryLimits[category] || 0);
  }, 0);

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

function getMonthStartDate(month) {
  return `${month}-01`;
}

function getMonthEndDate(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

function isDateInRange(date, fromDate, toDate) {
  if (!date) return false;
  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
}

function getExpensesForDateRange(fromDate, toDate) {
  return state.expenses.filter(expense => isDateInRange(expense.date, fromDate, toDate));
}

function getGenericReimbursementsForDateRange(fromDate, toDate) {
  return state.reimbursements.filter(reimbursement => isDateInRange(reimbursement.date, fromDate, toDate));
}

function getExpensesPeriodLabel() {
  if (!state.selectedExpensesDateFrom && !state.selectedExpensesDateTo) {
    return "tutto il periodo";
  }

  if (state.selectedExpensesDateFrom && state.selectedExpensesDateTo) {
    return `dal ${state.selectedExpensesDateFrom} al ${state.selectedExpensesDateTo}`;
  }

  if (state.selectedExpensesDateFrom) {
    return `dal ${state.selectedExpensesDateFrom}`;
  }

  return `fino al ${state.selectedExpensesDateTo}`;
}

function syncExpensesDateRangeWithMonth(month) {
  if (!month) {
    state.selectedExpensesDateFrom = "";
    state.selectedExpensesDateTo = "";
    return;
  }

  state.selectedExpensesMonth = month;
  state.selectedExpensesDateFrom = getMonthStartDate(month);
  state.selectedExpensesDateTo = getMonthEndDate(month);
}

function updateExpensesPeriodSummary() {
  const summary = document.getElementById("expensesPeriodSummary");
  if (!summary) return;

  if (state.selectedExpensesMonth && isSelectedExpensesRangeEqualToMonth(state.selectedExpensesMonth)) {
    summary.textContent = getMonthLabel(state.selectedExpensesMonth);
    return;
  }

  summary.textContent = getExpensesPeriodLabel();
}

function isSelectedExpensesRangeEqualToMonth(month) {
  if (!month) return false;
  return state.selectedExpensesDateFrom === getMonthStartDate(month)
    && state.selectedExpensesDateTo === getMonthEndDate(month);
}

function getQuickExpenseMonths() {
  const months = new Set(getMonthsWithExpenses());
  months.add(getCurrentMonth());
  if (state.selectedExpensesMonth) months.add(state.selectedExpensesMonth);
  return [...months].filter(Boolean).sort().reverse();
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

function addMonthsToMonthKey(monthKey, delta) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRangeAround(referenceMonth, monthsBefore = 6, monthsAfter = 6) {
  const months = [];
  for (let offset = -monthsBefore; offset <= monthsAfter; offset++) {
    months.push(addMonthsToMonthKey(referenceMonth, offset));
  }
  return months;
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

function getHomeMonths() {
  const months = new Set(getMonthsWithExpenses());
  months.add(getCurrentMonth());
  return [...months].filter(Boolean).sort().reverse();
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

function ensureSelectedExpensesMonth() {
  const months = getQuickExpenseMonths();

  if (!state.selectedExpensesMonth) {
    state.selectedExpensesMonth = months[0] || getCurrentMonth();
  }

  if (!state.selectedExpensesDateFrom || !state.selectedExpensesDateTo) {
    syncExpensesDateRangeWithMonth(state.selectedExpensesMonth || getCurrentMonth());
  }
}


function getTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

function isVoucherExpense(expense) {
  return String(expense.paymentMethod || "").toLowerCase() === "voucher";
}

function getBudgetRelevantExpenses(expenses) {
  return expenses.filter(expense => !isVoucherExpense(expense));
}

function getVoucherExpenses(expenses) {
  return expenses.filter(expense => isVoucherExpense(expense));
}

function getBudgetRelevantTotal(expenses) {
  return getTotal(getBudgetRelevantExpenses(expenses));
}

function getVoucherTotal(expenses) {
  return getTotal(getVoucherExpenses(expenses));
}

function getBudgetRelevantTotalsByCategory(expenses) {
  return getTotalsByCategory(getBudgetRelevantExpenses(expenses));
}

function getVoucherTotalsByCategory(expenses) {
  return getTotalsByCategory(getVoucherExpenses(expenses));
}

function getGenericReimbursementsForMonth(month) {
  return state.reimbursements.filter(reimbursement => reimbursement.month === month);
}

function getGenericReimbursementTotal(reimbursements) {
  return roundToTwoDecimals(reimbursements.reduce((sum, reimbursement) => sum + Number(reimbursement.amount || 0), 0));
}

function getGenericReimbursementTotalsByCategory(reimbursements) {
  return reimbursements.reduce((totals, reimbursement) => {
    totals[reimbursement.category] = (totals[reimbursement.category] || 0) + Number(reimbursement.amount || 0);
    return totals;
  }, {});
}

function getAllReimbursementTotal(expenses, genericReimbursements = []) {
  return roundToTwoDecimals(getReimbursementTotal(expenses) + getGenericReimbursementTotal(genericReimbursements));
}

function getNetBudgetTotal(expenses, genericReimbursements = []) {
  return roundToTwoDecimals(Math.max(0, getBudgetRelevantTotal(expenses) - getGenericReimbursementTotal(genericReimbursements)));
}

function getNetBudgetTotalsByCategory(expenses, genericReimbursements = []) {
  const totals = getBudgetRelevantTotalsByCategory(expenses);
  const genericTotals = getGenericReimbursementTotalsByCategory(genericReimbursements);

  state.categories.forEach(category => {
    totals[category] = roundToTwoDecimals(Math.max(0, Number(totals[category] || 0) - Number(genericTotals[category] || 0)));
  });

  return totals;
}

function getLinkedExpenses(expense) {
  if (!expense || expense.type !== "multi" || !expense.groupId) {
    return expense ? [expense] : [];
  }

  return state.expenses
    .filter(item => item.groupId === expense.groupId)
    .sort((a, b) => Number(a.installmentNumber || 0) - Number(b.installmentNumber || 0));
}

function getMultiTotalAmount(expense) {
  if (!expense || expense.type !== "multi") {
    return Number(expense?.amount || 0);
  }

  if (expense.originalAmount !== undefined && expense.originalAmount !== null) {
    return Number(expense.originalAmount || 0);
  }

  return getTotal(getLinkedExpenses(expense));
}

function calculateTotalLimitFromCategories() {
  return state.categories.reduce((sum, category) => {
    return sum + Number(state.thresholds.categoryLimits[category] || 0);
  }, 0);
}

function syncTotalLimitWithCategories() {
  state.thresholds.totalLimit = calculateTotalLimitFromCategories();
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

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setDefaultDate() {
  document.getElementById("date").value = getTodayDateString();

  const genericReimbursementDate = document.getElementById("genericReimbursementDate");
  if (genericReimbursementDate) {
    genericReimbursementDate.value = getTodayDateString();
  }
}

function renderCategoryOptions() {
  const options = state.categories
    .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = options;

  const genericReimbursementCategory = document.getElementById("genericReimbursementCategory");
  if (genericReimbursementCategory) {
    genericReimbursementCategory.innerHTML = options;
  }
}

function renderHomeMonthSelect() {
  const select = document.getElementById("homeMonthSelect");
  if (!select) return;

  const months = getHomeMonths();

  if (!state.selectedMonth || !months.includes(state.selectedMonth)) {
    state.selectedMonth = getCurrentMonth();
  }

  select.innerHTML = months
    .map(month => `
      <option value="${month}" ${month === state.selectedMonth ? "selected" : ""}>
        ${getMonthLabel(month)}
      </option>
    `)
    .join("");
}

function renderDashboard() {
  syncTotalLimitWithCategories();
  renderHomeMonthSelect();

  const month = state.selectedMonth;
  const expenses = getMonthlyExpenses(month);
  const genericReimbursements = getGenericReimbursementsForMonth(month);
  const grossTotal = getTotal(expenses);
  const voucherTotal = getVoucherTotal(expenses);
  const genericReimbursementTotal = getGenericReimbursementTotal(genericReimbursements);
  const total = getNetBudgetTotal(expenses, genericReimbursements);
  const limit = Number(state.thresholds.totalLimit || 0);
  const status = getThresholdStatus(total, limit);

  document.getElementById("currentMonthLabel").textContent = getMonthLabel(month);
  const selectedMonthLabel = document.getElementById("selectedMonthLabel");
  if (selectedMonthLabel) {
    selectedMonthLabel.textContent = getMonthLabel(month);
  }
  document.getElementById("monthlyTotal").textContent = formatCurrency(total);
  document.getElementById("monthlyBudget").textContent = formatCurrency(limit);
  document.getElementById("monthlyGrossTotal").textContent = formatCurrency(grossTotal);
  document.getElementById("monthlyNetTotalDetail").textContent = formatCurrency(total);
  document.getElementById("monthlyVoucherTotal").textContent = formatCurrency(voucherTotal);
  document.getElementById("monthlyGenericReimbursementTotal").textContent = formatCurrency(genericReimbursementTotal);

  const progress = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
  document.getElementById("monthlyProgressBar").style.width = `${progress}%`;
  document.getElementById("monthlyStatus").textContent =
    limit > 0
      ? `${Math.round(status.percentage)}% del budget utilizzato — ${status.label}`
      : "Imposta le soglie nella sezione Soglie";

  renderCriticalCategories(expenses, genericReimbursements);
  renderLatestExpenses(expenses);
}

function renderCriticalCategories(expenses, genericReimbursements = []) {
  const container = document.getElementById("criticalCategories");
  const totalsByCategory = getNetBudgetTotalsByCategory(expenses, genericReimbursements);
  const voucherTotalsByCategory = getVoucherTotalsByCategory(expenses);
  const genericReimbursementTotalsByCategory = getGenericReimbursementTotalsByCategory(genericReimbursements);

  const critical = state.categories
    .map(category => {
      const spent = totalsByCategory[category] || 0;
      const voucherSpent = voucherTotalsByCategory[category] || 0;
      const genericReimbursementSpent = genericReimbursementTotalsByCategory[category] || 0;
      const limit = Number(state.thresholds.categoryLimits[category] || 0);
      const status = getThresholdStatus(spent, limit);
      return { category, spent, voucherSpent, genericReimbursementSpent, limit, status };
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
          <span>Budget: ${formatCurrency(item.spent)} su ${formatCurrency(item.limit)}</span>
          ${item.voucherSpent > 0 ? `<br><span class="voucher-note">Voucher esclusi: ${formatCurrency(item.voucherSpent)}</span>` : ""}
          ${item.genericReimbursementSpent > 0 ? `<br><span class="reimbursement-note">Rimborsi generici detratti: ${formatCurrency(item.genericReimbursementSpent)}</span>` : ""}
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

  container.innerHTML = latest.map(expense => renderExpenseRow(expense, false)).join("");
}

function renderExpenseRow(expense, showDelete = false) {
  const multiInfo = expense.type === "multi"
    ? `<span><span class="badge info">Quota ${expense.installmentNumber}/${expense.installmentTotal}</span></span>`
    : "";

  const voucherInfo = isVoucherExpense(expense)
    ? `<span class="voucher-note">Voucher: non incide sul budget</span>`
    : "";

  const multiTotalInfo = expense.type === "multi"
    ? `<span class="multi-total-note">Importo complessivo: ${formatCurrency(getMultiTotalAmount(expense))}</span>`
    : "";

  const actions = showDelete
    ? `
      <details class="expense-action-menu">
        <summary class="icon-button menu-trigger" title="Azioni" aria-label="Azioni">⋯</summary>
        <div class="expense-actions icon-actions action-menu-panel">
          <button class="icon-button" onclick="startEditExpense('${expense.id}')" title="Modifica" aria-label="Modifica">✏️</button>
          <button class="icon-button repeat-icon" onclick="duplicateExpense('${expense.id}')" title="Ripeti/Duplica" aria-label="Ripeti o duplica spesa">🔁</button>
          <button class="icon-button" onclick="startReimbursementFromExpense('${expense.id}')" title="Rimborso" aria-label="Rimborso">↩️</button>
          <button class="icon-button danger" onclick="deleteExpense('${expense.id}')" title="Cancella" aria-label="Cancella">🗑️</button>
        </div>
      </details>
    `
    : "";

  return `
    <div class="expense-row">
      <div class="expense-main">
        <strong>${escapeHtml(expense.category)}</strong>
        <span>${expense.date} · ${escapeHtml(expense.paymentMethod)}</span>
        <span>${escapeHtml(expense.description || "Nessuna descrizione")}</span>
        ${multiInfo}
        ${multiTotalInfo}
        ${voucherInfo}
      </div>
      <div>
        <div class="amount">${formatCurrency(expense.amount)}</div>
        ${actions}
      </div>
    </div>
    ${editingExpenseId === expense.id ? renderEditExpenseForm(expense) : ""}
  `;
}

function getSelectedExpenseCategorySet() {
  if (Array.isArray(state.selectedExpenseCategories) && state.selectedExpenseCategories.includes("__NONE__")) {
    return new Set();
  }

  const selected = Array.isArray(state.selectedExpenseCategories)
    ? state.selectedExpenseCategories.filter(category => state.categories.includes(category))
    : [];

  if (selected.length === 0 || selected.length === state.categories.length) {
    return null;
  }

  return new Set(selected);
}

function filterBySelectedExpenseCategories(items) {
  const selectedCategorySet = getSelectedExpenseCategorySet();

  if (!selectedCategorySet) {
    return items;
  }

  if (selectedCategorySet.size === 0) {
    return [];
  }

  return items.filter(item => selectedCategorySet.has(item.category));
}

function renderExpenseCategoryFilter() {
  const container = document.getElementById("expenseCategoryFilter");
  if (!container) return;

  const noCategorySelected = Array.isArray(state.selectedExpenseCategories) && state.selectedExpenseCategories.includes("__NONE__");
  const selected = noCategorySelected
    ? []
    : (Array.isArray(state.selectedExpenseCategories)
      ? state.selectedExpenseCategories.filter(category => state.categories.includes(category))
      : []);

  const selectedSet = new Set(selected);
  const isAllSelected = !noCategorySelected && (selected.length === 0 || selected.length === state.categories.length);

  container.innerHTML = state.categories.map(category => `
    <label class="category-filter-pill">
      <input
        type="checkbox"
        value="${escapeAttributeForHtml(category)}"
        ${isAllSelected || selectedSet.has(category) ? "checked" : ""}
        onchange="toggleExpenseCategoryFilter('${escapeAttributeForHtml(category)}', this.checked)"
      />
      <span>${escapeHtml(category)}</span>
    </label>
  `).join("");

  updateExpenseCategoryFilterSummary();
}

function updateExpenseCategoryFilterSummary() {
  const summary = document.getElementById("expenseCategoryFilterSummary");
  if (!summary) return;

  if (Array.isArray(state.selectedExpenseCategories) && state.selectedExpenseCategories.includes("__NONE__")) {
    summary.textContent = "Nessuna";
    return;
  }

  const selected = Array.isArray(state.selectedExpenseCategories)
    ? state.selectedExpenseCategories.filter(category => state.categories.includes(category))
    : [];

  if (selected.length === 0 || selected.length === state.categories.length) {
    summary.textContent = "Tutte";
  } else {
    summary.textContent = `${selected.length} selezionate`;
  }
}

function toggleExpenseCategoryFilter(category, checked) {
  const wasNoneSelected = Array.isArray(state.selectedExpenseCategories) && state.selectedExpenseCategories.includes("__NONE__");
  let selected = wasNoneSelected
    ? []
    : (Array.isArray(state.selectedExpenseCategories)
      ? state.selectedExpenseCategories.filter(item => state.categories.includes(item))
      : []);

  if (wasNoneSelected) {
    selected = checked ? [category] : [];
  } else if (selected.length === 0 || selected.length === state.categories.length) {
    selected = checked ? [...state.categories] : state.categories.filter(item => item !== category);
  } else if (checked) {
    selected = [...new Set([...selected, category])];
  } else {
    selected = selected.filter(item => item !== category);
  }

  state.selectedExpenseCategories = selected.length === 0
    ? ["__NONE__"]
    : (selected.length === state.categories.length ? [] : selected);

  saveState();
  renderExpensesList();
}

function selectAllExpenseCategories() {
  state.selectedExpenseCategories = [];
  saveState();
  renderExpensesList();
}

function resetExpenseCategoryFilterToAll() {
  state.selectedExpenseCategories = [];
  saveState();
}

function selectNoExpenseCategories() {
  state.selectedExpenseCategories = ["__NONE__"];
  saveState();
  renderExpensesList();
}

function getExpenseDescriptionSearchTerm() {
  return String(state.selectedExpenseDescriptionSearch || "").trim().toLowerCase();
}

function filterByExpenseDescriptionSearch(items) {
  const term = getExpenseDescriptionSearchTerm();
  if (!term) return items;

  return items.filter(item => String(item.description || "").toLowerCase().includes(term));
}

function renderExpenseDescriptionSearchFilter() {
  const input = document.getElementById("expenseDescriptionSearchInput");
  if (input) {
    input.value = state.selectedExpenseDescriptionSearch || "";
  }

  updateExpenseDescriptionSearchSummary();
}

function updateExpenseDescriptionSearchSummary() {
  const summary = document.getElementById("expenseDescriptionSearchSummary");
  if (!summary) return;

  const term = String(state.selectedExpenseDescriptionSearch || "").trim();
  summary.textContent = term ? `"${term}"` : "Nessuna ricerca";
}

function applyExpenseDescriptionSearch() {
  const input = document.getElementById("expenseDescriptionSearchInput");
  state.selectedExpenseDescriptionSearch = input ? input.value.trim() : "";
  saveState();
  renderExpensesList();
}

function clearExpenseDescriptionSearch() {
  state.selectedExpenseDescriptionSearch = "";
  saveState();
  renderExpensesList();
}

function renderExpensesList() {
  const select = document.getElementById("expensesMonthSelect");
  const fromInput = document.getElementById("expensesDateFrom");
  const toInput = document.getElementById("expensesDateTo");
  const container = document.getElementById("expensesList");
  const selectedTotal = document.getElementById("selectedExpensesTotal");

  ensureSelectedExpensesMonth();
  renderExpenseCategoryFilter();
  renderExpenseDescriptionSearchFilter();

  const months = getQuickExpenseMonths();

  if (select) {
    select.disabled = months.length === 0;
    select.innerHTML = months
      .map(month => `
        <option value="${month}" ${month === state.selectedExpensesMonth ? "selected" : ""}>
          ${getMonthLabel(month)}
        </option>
      `)
      .join("");

    if (state.selectedExpensesMonth && !isSelectedExpensesRangeEqualToMonth(state.selectedExpensesMonth)) {
      const customOption = document.createElement("option");
      customOption.value = "__custom__";
      customOption.textContent = "Periodo personalizzato";
      customOption.selected = true;
      select.prepend(customOption);
    }
  }

  if (fromInput) fromInput.value = state.selectedExpensesDateFrom || "";
  if (toInput) toInput.value = state.selectedExpensesDateTo || "";
  updateExpensesPeriodSummary();

  if (!container) return;

  if (state.selectedExpensesDateFrom && state.selectedExpensesDateTo && state.selectedExpensesDateFrom > state.selectedExpensesDateTo) {
    container.innerHTML = `<p class="empty">La data iniziale non può essere successiva alla data finale.</p>`;
    if (selectedTotal) selectedTotal.textContent = formatCurrency(0);
    renderGenericReimbursementsList();
    return;
  }

  const periodLabel = getExpensesPeriodLabel();

  const expenses = filterByExpenseDescriptionSearch(filterBySelectedExpenseCategories(
    getExpensesForDateRange(state.selectedExpensesDateFrom, state.selectedExpensesDateTo)
  )).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (selectedTotal) {
    selectedTotal.textContent = formatCurrency(getTotal(expenses));
  }

  if (expenses.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna spesa per il periodo ${periodLabel}.</p>`;
    renderGenericReimbursementsList();
    return;
  }

  container.innerHTML = expenses.map(expense => renderExpenseRow(expense, true)).join("");
  renderGenericReimbursementsList();
}


function renderGenericReimbursementsList() {
  const container = document.getElementById("genericReimbursementsList");
  if (!container) return;

  const periodLabel = getExpensesPeriodLabel();
  const reimbursements = filterByExpenseDescriptionSearch(filterBySelectedExpenseCategories(
    getGenericReimbursementsForDateRange(state.selectedExpensesDateFrom, state.selectedExpensesDateTo)
  )).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (reimbursements.length === 0) {
    container.innerHTML = `<p class="empty">Nessun rimborso generico per il periodo ${periodLabel}.</p>`;
    return;
  }

  container.innerHTML = reimbursements.map(reimbursement => `
    <div class="reimbursement-row">
      <div>
        <strong>${escapeHtml(reimbursement.category)}</strong><br>
        <span>${reimbursement.date}</span><br>
        <span>${escapeHtml(reimbursement.description || "Rimborso generico")}</span>
      </div>
      <div>
        <div class="amount">${formatCurrency(reimbursement.amount)}</div>
        <div class="expense-actions icon-actions">
          <button class="icon-button" onclick="startEditGenericReimbursement('${reimbursement.id}')" title="Modifica rimborso" aria-label="Modifica rimborso">✏️</button>
          <button class="icon-button danger" onclick="deleteGenericReimbursement('${reimbursement.id}')" title="Elimina rimborso" aria-label="Elimina rimborso">🗑️</button>
        </div>
      </div>
    </div>
    ${editingReimbursementId === reimbursement.id ? renderEditGenericReimbursementForm(reimbursement) : ""}
  `).join("");
}

function renderEditGenericReimbursementForm(reimbursement) {
  const categoryOptions = state.categories
    .map(category => `
      <option value="${escapeHtml(category)}" ${category === reimbursement.category ? "selected" : ""}>
        ${escapeHtml(category)}
      </option>
    `)
    .join("");

  return `
    <form class="edit-expense-form" onsubmit="saveEditedGenericReimbursement(event, '${reimbursement.id}')">
      <h3>Modifica rimborso</h3>

      <label>
        Importo rimborso
        <input id="editReimbursementAmount-${reimbursement.id}" type="number" step="0.01" min="0" value="${Number(reimbursement.amount || 0)}" required />
      </label>

      <label>
        Categoria
        <select id="editReimbursementCategory-${reimbursement.id}" required>
          ${categoryOptions}
        </select>
      </label>

      <label>
        Data
        <input id="editReimbursementDate-${reimbursement.id}" type="date" value="${escapeHtml(reimbursement.date)}" required />
      </label>

      <label>
        Descrizione
        <input id="editReimbursementDescription-${reimbursement.id}" type="text" value="${escapeAttributeForHtml(reimbursement.description || "")}" />
      </label>

      <div class="edit-actions">
        <button type="submit">Salva</button>
        <button type="button" class="secondary" onclick="cancelEditGenericReimbursement()">Annulla</button>
      </div>
    </form>
  `;
}

function startEditGenericReimbursement(id) {
  editingReimbursementId = id;
  editingExpenseId = null;
  renderExpensesList();
}

function cancelEditGenericReimbursement() {
  editingReimbursementId = null;
  renderExpensesList();
}

function saveEditedGenericReimbursement(event, id) {
  event.preventDefault();

  const index = state.reimbursements.findIndex(reimbursement => reimbursement.id === id);
  if (index === -1) {
    alert("Rimborso non trovato.");
    editingReimbursementId = null;
    renderExpensesList();
    return;
  }

  const amount = Number(document.getElementById(`editReimbursementAmount-${id}`).value || 0);
  const category = document.getElementById(`editReimbursementCategory-${id}`).value;
  const date = document.getElementById(`editReimbursementDate-${id}`).value;
  const description = document.getElementById(`editReimbursementDescription-${id}`).value.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Inserisci un importo rimborso maggiore di zero.");
    return;
  }

  if (!date) {
    alert("Inserisci una data valida.");
    return;
  }

  state.reimbursements[index] = {
    ...state.reimbursements[index],
    amount: roundToTwoDecimals(amount),
    category,
    date,
    month: getMonthFromDate(date),
    description
  };

  editingReimbursementId = null;
  saveState();
  renderAll();
}

function deleteGenericReimbursement(id) {
  const confirmed = confirm("Vuoi eliminare questo rimborso?");
  if (!confirmed) return;

  state.reimbursements = state.reimbursements.filter(reimbursement => reimbursement.id !== id);
  editingReimbursementId = null;
  saveState();
  renderAll();
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
    renderMultiReport();
    return;
  }

  const expenses = getMonthlyExpenses(selectedReportMonth);
  const genericReimbursements = getGenericReimbursementsForMonth(selectedReportMonth);
  const totalsByCategory = getNetBudgetTotalsByCategory(expenses, genericReimbursements);
  const grossTotalsByCategory = getTotalsByCategory(expenses);
  const voucherTotalsByCategory = getVoucherTotalsByCategory(expenses);
  const genericReimbursementTotalsByCategory = getGenericReimbursementTotalsByCategory(genericReimbursements);
  const total = getNetBudgetTotal(expenses, genericReimbursements);
  const grossTotal = getTotal(expenses);
  const voucherTotal = getVoucherTotal(expenses);
  const genericReimbursementTotal = getGenericReimbursementTotal(genericReimbursements);

  if (expenses.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna spesa presente per il mese selezionato.</p>`;
    renderMultiReport();
    return;
  }

  const summary = `
    <div class="report-summary">
      <span>Budget utilizzato ${getMonthLabel(selectedReportMonth)}</span>
      <strong>${formatCurrency(total)}</strong>
    </div>
    <div class="report-summary">
      <span>Totale registrato / Voucher / Rimborsi generici</span>
      <strong>${formatCurrency(grossTotal)} / ${formatCurrency(voucherTotal)} / ${formatCurrency(genericReimbursementTotal)}</strong>
    </div>
  `;

  const rows = state.categories
    .filter(category => (totalsByCategory[category] || 0) > 0 || (state.thresholds.categoryLimits[category] || 0) > 0)
    .map(category => {
      const spent = totalsByCategory[category] || 0;
      const grossSpent = grossTotalsByCategory[category] || 0;
      const voucherSpent = voucherTotalsByCategory[category] || 0;
      const genericReimbursementSpent = genericReimbursementTotalsByCategory[category] || 0;
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
            <span>Budget: ${formatCurrency(spent)} su ${formatCurrency(limit)}</span>
            <br>
            <span>Totale registrato: ${formatCurrency(grossSpent)}</span>
            ${voucherSpent > 0 ? `<br><span class="voucher-note">Voucher esclusi dal budget: ${formatCurrency(voucherSpent)}</span>` : ""}
            ${genericReimbursementSpent > 0 ? `<br><span class="reimbursement-note">Rimborsi generici detratti: ${formatCurrency(genericReimbursementSpent)}</span>` : ""}
            <div class="report-bar">
              <div style="width: ${width}%"></div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = summary + rows;
  renderMultiReport();
}

function getCategoryColor(index) {
  const colors = [
    "#2563eb", "#16a34a", "#f97316", "#9333ea",
    "#dc2626", "#0891b2", "#ca8a04", "#4b5563",
    "#be185d", "#0f766e", "#7c3aed", "#65a30d"
  ];
  return colors[index % colors.length];
}

function getSelectedMultiReportCategories() {
  if (Array.isArray(state.selectedMultiReportCategories) && state.selectedMultiReportCategories.includes("__NONE__")) {
    return [];
  }

  const selected = Array.isArray(state.selectedMultiReportCategories)
    ? state.selectedMultiReportCategories.filter(category => state.categories.includes(category))
    : [];

  if (selected.length === 0 || selected.length === state.categories.length) {
    return [...state.categories];
  }

  return selected;
}

function renderMultiReportCategoryFilter() {
  const container = document.getElementById("multiReportCategoryFilter");
  if (!container) return;

  const noCategorySelected = Array.isArray(state.selectedMultiReportCategories) && state.selectedMultiReportCategories.includes("__NONE__");
  const selected = noCategorySelected
    ? []
    : (Array.isArray(state.selectedMultiReportCategories)
      ? state.selectedMultiReportCategories.filter(category => state.categories.includes(category))
      : []);

  const selectedSet = new Set(selected);
  const isAllSelected = !noCategorySelected && (selected.length === 0 || selected.length === state.categories.length);

  container.innerHTML = state.categories.map(category => `
    <label class="category-filter-pill">
      <input
        type="checkbox"
        value="${escapeAttributeForHtml(category)}"
        ${isAllSelected || selectedSet.has(category) ? "checked" : ""}
        onchange="toggleMultiReportCategoryFilter('${escapeAttributeForHtml(category)}', this.checked)"
      />
      <span>${escapeHtml(category)}</span>
    </label>
  `).join("");

  updateMultiReportCategoryFilterSummary();
}

function updateMultiReportCategoryFilterSummary() {
  const summary = document.getElementById("multiReportCategoryFilterSummary");
  if (!summary) return;

  if (Array.isArray(state.selectedMultiReportCategories) && state.selectedMultiReportCategories.includes("__NONE__")) {
    summary.textContent = "Nessuna";
    return;
  }

  const selected = Array.isArray(state.selectedMultiReportCategories)
    ? state.selectedMultiReportCategories.filter(category => state.categories.includes(category))
    : [];

  if (selected.length === 0 || selected.length === state.categories.length) {
    summary.textContent = "Tutte";
  } else {
    summary.textContent = `${selected.length} selezionate`;
  }
}

function toggleMultiReportCategoryFilter(category, checked) {
  const wasNoneSelected = Array.isArray(state.selectedMultiReportCategories) && state.selectedMultiReportCategories.includes("__NONE__");
  let selected = wasNoneSelected
    ? []
    : (Array.isArray(state.selectedMultiReportCategories)
      ? state.selectedMultiReportCategories.filter(item => state.categories.includes(item))
      : []);

  if (wasNoneSelected) {
    selected = checked ? [category] : [];
  } else if (selected.length === 0 || selected.length === state.categories.length) {
    selected = checked ? [...state.categories] : state.categories.filter(item => item !== category);
  } else if (checked) {
    selected = [...new Set([...selected, category])];
  } else {
    selected = selected.filter(item => item !== category);
  }

  state.selectedMultiReportCategories = selected.length === 0
    ? ["__NONE__"]
    : (selected.length === state.categories.length ? [] : selected);

  saveState();
  renderMultiReport();
}

function selectAllMultiReportCategories() {
  state.selectedMultiReportCategories = [];
  saveState();
  renderMultiReport();
}

function selectNoMultiReportCategories() {
  state.selectedMultiReportCategories = ["__NONE__"];
  saveState();
  renderMultiReport();
}

function resetMultiReportCategoryFilterToAll() {
  state.selectedMultiReportCategories = [];
  saveState();
}

function getMultiReportData() {
  const referenceMonth = state.selectedMultiReportReferenceMonth || getCurrentMonth();
  const monthsBefore = Number(state.selectedMultiReportMonthsBefore || 0);
  const monthsAfter = Number(state.selectedMultiReportMonthsAfter || 0);
  const months = getMonthRangeAround(referenceMonth, monthsBefore, monthsAfter);
  const selectedCategories = getSelectedMultiReportCategories();

  return months.map(month => {
    const expenses = getMonthlyExpenses(month);
    const genericReimbursements = getGenericReimbursementsForMonth(month);
    const totalsByCategory = getNetBudgetTotalsByCategory(expenses, genericReimbursements);
    const grossTotalsByCategory = getTotalsByCategory(expenses);
    const voucherTotalsByCategory = getVoucherTotalsByCategory(expenses);
    const genericReimbursementTotalsByCategory = getGenericReimbursementTotalsByCategory(genericReimbursements);
    const total = roundToTwoDecimals(selectedCategories.reduce((sum, category) => {
      return sum + Number(totalsByCategory[category] || 0);
    }, 0));
    const grossTotal = getTotal(expenses);
    const voucherTotal = getVoucherTotal(expenses);
    const genericReimbursementTotal = getGenericReimbursementTotal(genericReimbursements);
    return { month, total, grossTotal, voucherTotal, genericReimbursementTotal, totalsByCategory, grossTotalsByCategory, voucherTotalsByCategory, genericReimbursementTotalsByCategory };
  });
}

function renderMultiReportRangeSelectors() {
  const beforeSelect = document.getElementById("multiReportMonthsBefore");
  const afterSelect = document.getElementById("multiReportMonthsAfter");

  if (!beforeSelect || !afterSelect) return;

  const options = Array.from({ length: 13 }, (_, index) => {
    return `<option value="${index}">${index}</option>`;
  }).join("");

  beforeSelect.innerHTML = options;
  afterSelect.innerHTML = options;

  beforeSelect.value = String(Number(state.selectedMultiReportMonthsBefore || 0));
  afterSelect.value = String(Number(state.selectedMultiReportMonthsAfter || 0));
}

function renderMultiReport() {
  syncTotalLimitWithCategories();

  const input = document.getElementById("multiReportReferenceMonth");
  if (!input) return;

  if (!state.selectedMultiReportReferenceMonth) {
    state.selectedMultiReportReferenceMonth = getCurrentMonth();
  }

  input.value = state.selectedMultiReportReferenceMonth;
  renderMultiReportRangeSelectors();
  renderMultiReportCategoryFilter();

  const data = getMultiReportData();
  drawMultiReportChart(data);
  renderMultiReportLegend();
  renderMultiReportTable(data);
}

function drawMultiReportChart(data) {
  const canvas = document.getElementById("multiReportChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 34, right: 46, bottom: 86, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const selectedCategories = getSelectedMultiReportCategories();

  const maxStack = Math.max(
    ...data.map(item => selectedCategories.reduce((sum, category) => sum + Number(item.totalsByCategory[category] || 0), 0)),
    ...data.map(item => item.total),
    Number(state.thresholds.totalLimit || 0),
    1
  );

  const niceMax = Math.ceil(maxStack / 100) * 100 || 100;

  function yScale(value) {
    return padding.top + chartHeight - (value / niceMax) * chartHeight;
  }

  ctx.strokeStyle = "#e5e7eb";
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px system-ui";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 5; i++) {
    const value = (niceMax / 5) * i;
    const y = yScale(value);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(formatCurrency(value).replace(",00", ""), padding.left - 8, y);
  }

  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(42, groupWidth * 0.56);

  data.forEach((item, index) => {
    const x = padding.left + index * groupWidth + (groupWidth - barWidth) / 2;
    let accumulated = 0;

    selectedCategories.forEach(category => {
      const categoryIndex = state.categories.indexOf(category);
      const value = Number(item.totalsByCategory[category] || 0);
      if (value <= 0) return;

      const yTop = yScale(accumulated + value);
      const yBottom = yScale(accumulated);
      const segmentHeight = yBottom - yTop;

      ctx.fillStyle = getCategoryColor(categoryIndex);
      ctx.fillRect(x, yTop, barWidth, Math.max(segmentHeight, 1));
      accumulated += value;
    });

    const label = item.month.slice(5, 7) + "/" + item.month.slice(2, 4);
    ctx.save();
    ctx.translate(x + barWidth / 2, height - padding.bottom + 22);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "#374151";
    ctx.font = "12px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.beginPath();

  data.forEach((item, index) => {
    const x = padding.left + index * groupWidth + groupWidth / 2;
    const y = yScale(item.total);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  data.forEach((item, index) => {
    const x = padding.left + index * groupWidth + groupWidth / 2;
    const y = yScale(item.total);

    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    if (item.total > 0) {
      ctx.fillStyle = "#111827";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(Math.round(item.total).toString(), x, y - 7);
    }
  });

  ctx.fillStyle = "#111827";
  ctx.font = "bold 15px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Budget per categoria e totale mensile utilizzato", padding.left, 10);
}

function renderMultiReportLegend() {
  const container = document.getElementById("multiReportLegend");
  if (!container) return;

  const selectedCategories = getSelectedMultiReportCategories();

  const categoryItems = selectedCategories.map(category => {
    const index = state.categories.indexOf(category);
    return `
      <span class="legend-item">
        <span class="legend-color" style="background:${getCategoryColor(index)}"></span>
        ${escapeHtml(category)}
      </span>
    `;
  }).join("");

  container.innerHTML = categoryItems + `
    <span class="legend-item">
      <span class="legend-line"></span>
      Totale budget mensile
    </span>
  `;
}

function renderMultiReportTable(data) {
  const container = document.getElementById("multiReportTable");
  if (!container) return;

  const selectedCategories = getSelectedMultiReportCategories();

  const rows = data.map(item => {
    const categoryCells = selectedCategories.map(category => {
      return `<td>${formatCurrency(item.totalsByCategory[category] || 0)}</td>`;
    }).join("");

    return `
      <tr>
        <td>${getMonthLabel(item.month)}</td>
        ${categoryCells}
        <td><strong>${formatCurrency(item.total)}</strong></td>
        <td>${formatCurrency(item.grossTotal || 0)}</td>
        <td>${formatCurrency(item.voucherTotal || 0)}</td>
        <td>${formatCurrency(item.genericReimbursementTotal || 0)}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="multi-table">
      <table>
        <thead>
          <tr>
            <th>Mese</th>
            ${selectedCategories.map(category => `<th>${escapeHtml(category)} budget</th>`).join("")}
            <th>Totale budget</th>
            <th>Totale registrato</th>
            <th>Voucher</th>
            <th>Rimborsi generici</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderThresholdForm() {
  syncTotalLimitWithCategories();
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

  container.innerHTML = state.categories.map((category, index) => {
    const used = state.expenses.some(expense => expense.category === category);

    return `
      <div class="category-row">
        <input class="category-name-input" value="${escapeAttributeForHtml(category)}" data-category-index="${index}" data-category-old-name="${escapeAttributeForHtml(category)}" />
        <div class="category-actions">
          <button class="secondary small" onclick="renameCategoryByIndex(${index})">Salva</button>
          <button class="danger small" onclick="deleteCategoryByIndex(${index})" ${used ? "title='Categoria usata da alcune spese'" : ""}>Elimina</button>
        </div>
      </div>
    `;
  }).join("");
}

function renameCategoryByIndex(index) {
  const oldName = state.categories[index];
  if (!oldName) return;

  const input = document.querySelector(`[data-category-index="${index}"]`);
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

  state.categories[index] = newName;

  state.expenses = state.expenses.map(expense => ({
    ...expense,
    category: expense.category === oldName ? newName : expense.category
  }));

  state.thresholds.categoryLimits[newName] = state.thresholds.categoryLimits[oldName] || 0;

  if (newName !== oldName) {
    delete state.thresholds.categoryLimits[oldName];
  }

  syncTotalLimitWithCategories();
  saveState();
  renderAll();
}

function deleteCategoryByIndex(index) {
  const categoryName = state.categories[index];
  if (!categoryName) return;
  deleteCategory(categoryName);
}

function renderAll() {
  renderCategoryOptions();
  renderDashboard();
  renderExpensesList();
  renderReport();
  renderThresholdForm();
  renderCategoriesList();
}

function updateGenericReimbursementMode() {
  const isGeneric = document.getElementById("isGenericReimbursement")?.checked || false;
  const expenseOnlyFields = document.getElementById("expenseOnlyFields");
  const amountHint = document.getElementById("amountHint");
  const saveButton = document.getElementById("saveExpenseButton");
  const isMultiMonth = document.getElementById("isMultiMonth");
  const multiMonthOptions = document.getElementById("multiMonthOptions");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const isSourceReimbursement = Boolean(reimbursementSourceExpenseId);

  if (expenseOnlyFields) {
    expenseOnlyFields.classList.toggle("hidden", isGeneric);
  }

  if (amountHint) {
    amountHint.textContent = isGeneric
      ? "Importo del rimborso da detrarre dalla categoria scelta."
      : "Importo della spesa.";
  }

  if (saveButton) {
    saveButton.textContent = isGeneric ? "Salva rimborso" : "Salva spesa";
  }

  if (isGeneric) {
    if (isMultiMonth) isMultiMonth.checked = false;
    if (multiMonthOptions) multiMonthOptions.classList.add("hidden");
  }

  if (category) {
    category.disabled = isSourceReimbursement;
  }

  if (description) {
    description.readOnly = isSourceReimbursement;
  }

  const genericCheckbox = document.getElementById("isGenericReimbursement");
  if (genericCheckbox) {
    genericCheckbox.disabled = isSourceReimbursement;
  }
}

function resetReimbursementSourceMode() {
  reimbursementSourceExpenseId = null;

  const category = document.getElementById("category");
  const description = document.getElementById("description");
  const genericCheckbox = document.getElementById("isGenericReimbursement");

  if (category) category.disabled = false;
  if (description) description.readOnly = false;
  if (genericCheckbox) genericCheckbox.disabled = false;
}


function addExpense(event) {
  event.preventDefault();

  const totalAmount = Number(document.getElementById("amount").value);
  const isGenericReimbursement = document.getElementById("isGenericReimbursement")?.checked || false;
  const date = document.getElementById("date").value;
  const isMultiMonth = !isGenericReimbursement && document.getElementById("isMultiMonth").checked;
  const numberOfMonths = Number(document.getElementById("numberOfMonths").value || 1);
  const category = document.getElementById("category").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const description = document.getElementById("description").value.trim();

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    alert(isGenericReimbursement ? "Inserisci un importo rimborso maggiore di zero." : "Inserisci un importo spesa maggiore di zero.");
    return;
  }

  if (!date) {
    alert("Inserisci una data valida.");
    return;
  }

  if (isGenericReimbursement) {
    state.reimbursements.push({
      id: createId(),
      amount: roundToTwoDecimals(totalAmount),
      category,
      date,
      month: getMonthFromDate(date),
      description: description || "Rimborso generico",
      sourceExpenseId: reimbursementSourceExpenseId || null
    });

    saveState();
    event.target.reset();
    resetReimbursementSourceMode();
    setDefaultDate();
    updateGenericReimbursementMode();
    showView("dashboardView");
    renderAll();
    return;
  }

  if (!isMultiMonth) {
    state.expenses.push({
      id: createId(),
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

    const groupId = createId();
    const baseAmount = Math.floor((totalAmount / numberOfMonths) * 100) / 100;
    const amounts = Array(numberOfMonths).fill(baseAmount);
    const remainder = roundToTwoDecimals(totalAmount - baseAmount * numberOfMonths);
    amounts[numberOfMonths - 1] = roundToTwoDecimals(amounts[numberOfMonths - 1] + remainder);

    for (let i = 0; i < numberOfMonths; i++) {
      const installmentTarget = getTargetYearMonth(date, i);
      const installmentDate = getInstallmentDate(date, i);

      state.expenses.push({
        id: createId(),
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
  resetReimbursementSourceMode();
  setDefaultDate();
  updateGenericReimbursementMode();
  document.getElementById("multiMonthOptions").classList.add("hidden");
  showView("dashboardView");
  renderAll();
}


function startReimbursementFromExpense(id) {
  const expense = state.expenses.find(item => item.id === id);
  if (!expense) {
    alert("Spesa non trovata.");
    return;
  }

  reimbursementSourceExpenseId = id;

  showView("addView");
  setDefaultDate();

  const genericCheckbox = document.getElementById("isGenericReimbursement");
  const amount = document.getElementById("amount");
  const category = document.getElementById("category");
  const date = document.getElementById("date");
  const description = document.getElementById("description");

  if (genericCheckbox) genericCheckbox.checked = true;
  if (amount) amount.value = Number(expense.amount || 0).toFixed(2);
  if (category) category.value = expense.category;
  if (date) date.value = getTodayDateString();
  if (description) {
    description.value = expense.description
      ? `Rimborso: ${expense.description}`
      : `Rimborso ${expense.category}`;
  }

  updateGenericReimbursementMode();

  if (amount) {
    amount.focus();
  }
}

function renderEditExpenseForm(expense) {
  const categoryOptions = state.categories
    .map(category => `
      <option value="${escapeHtml(category)}" ${category === expense.category ? "selected" : ""}>
        ${escapeHtml(category)}
      </option>
    `)
    .join("");

  const paymentMethods = ["Contanti", "Carta", "Bancomat", "Bonifico", "Voucher", "Altro"];
  const paymentOptions = paymentMethods
    .map(method => `
      <option value="${escapeHtml(method)}" ${method === expense.paymentMethod ? "selected" : ""}>
        ${escapeHtml(method)}
      </option>
    `)
    .join("");

  const isMulti = expense.type === "multi";
  const multiWarning = isMulti
    ? `<p class="hint">Questa è una quota di una spesa plurimensile. Puoi modificare solo questa quota oppure applicare alcune modifiche a tutte le quote collegate.</p>`
    : "";

  const multiTotalField = isMulti
    ? `
      <label>
        Importo complessivo
        <input id="editOriginalAmount-${expense.id}" type="number" step="0.01" min="0" value="${Number(getMultiTotalAmount(expense) || 0)}" />
        <span class="hint">Modificando questo valore e attivando "Ridividi importo complessivo", l'app ripartisce il totale su tutte le quote collegate.</span>
      </label>
    `
    : "";

  const multiScopeOptions = isMulti
    ? `
      <div class="edit-scope-box">
        <strong>Applica modifiche alle quote collegate</strong>

        <label class="checkbox-row">
          <input id="editApplyText-${expense.id}" type="checkbox" />
          <span>Applica categoria, metodo pagamento e descrizione a tutte le quote</span>
        </label>

        <label class="checkbox-row">
          <input id="editRedistributeAmount-${expense.id}" type="checkbox" />
          <span>Ridividi importo complessivo su tutte le quote</span>
        </label>

        <p class="hint">
          La data resta specifica della singola quota. Per cambiare l'intera pianificazione conviene eliminare e reinserire la spesa plurimensile.
        </p>
      </div>
    `
    : "";

  return `
    <form class="edit-expense-form" onsubmit="saveEditedExpense(event, '${expense.id}')">
      <h3>Modifica spesa</h3>
      ${multiWarning}

      <label>
        Importo quota
        <input id="editAmount-${expense.id}" type="number" step="0.01" min="0" value="${Number(expense.amount || 0)}" required />
      </label>

      ${multiTotalField}

      <label>
        Categoria
        <select id="editCategory-${expense.id}" required>
          ${categoryOptions}
        </select>
      </label>

      <label>
        Data
        <input id="editDate-${expense.id}" type="date" value="${escapeHtml(expense.date)}" required />
      </label>

      <label>
        Metodo pagamento
        <select id="editPaymentMethod-${expense.id}">
          ${paymentOptions}
        </select>
      </label>

      <label>
        Descrizione
        <input id="editDescription-${expense.id}" type="text" value="${escapeAttributeForHtml(expense.description || "")}" />
      </label>

      ${multiScopeOptions}

      <div class="edit-actions">
        <button type="submit">Salva</button>
        <button type="button" class="secondary" onclick="cancelEditExpense()">Annulla</button>
      </div>
    </form>
  `;
}

function startEditExpense(id) {
  editingExpenseId = id;
  editingReimbursementId = null;
  renderExpensesList();
}

function cancelEditExpense() {
  editingExpenseId = null;
  renderExpensesList();
}

function saveEditedExpense(event, id) {
  event.preventDefault();

  const expenseIndex = state.expenses.findIndex(expense => expense.id === id);
  if (expenseIndex === -1) {
    alert("Spesa non trovata.");
    editingExpenseId = null;
    renderExpensesList();
    return;
  }

  const existingExpense = state.expenses[expenseIndex];
  const amount = Number(document.getElementById(`editAmount-${id}`).value || 0);
  const category = document.getElementById(`editCategory-${id}`).value;
  const date = document.getElementById(`editDate-${id}`).value;
  const paymentMethod = document.getElementById(`editPaymentMethod-${id}`).value;
  const description = document.getElementById(`editDescription-${id}`).value.trim();

  const isMulti = existingExpense.type === "multi" && existingExpense.groupId;
  const applyTextToAll = isMulti && document.getElementById(`editApplyText-${id}`)?.checked;
  const redistributeAmount = isMulti && document.getElementById(`editRedistributeAmount-${id}`)?.checked;

  if (!isMulti) {
    state.expenses[expenseIndex] = {
      ...existingExpense,
      amount: roundToTwoDecimals(amount),
      category,
      date,
      month: getMonthFromDate(date),
      paymentMethod,
      description
    };
  } else {
    const linkedExpenses = getLinkedExpenses(existingExpense);
    const linkedIds = new Set(linkedExpenses.map(expense => expense.id));

    if (applyTextToAll) {
      state.expenses = state.expenses.map(expense => {
        if (!linkedIds.has(expense.id)) return expense;

        return {
          ...expense,
          category,
          paymentMethod,
          description
        };
      });
    }

    if (redistributeAmount) {
      const totalAmountInput = document.getElementById(`editOriginalAmount-${id}`);
      const totalAmount = Number(totalAmountInput?.value || 0);
      const numberOfInstallments = linkedExpenses.length || 1;
      const baseAmount = Math.floor((totalAmount / numberOfInstallments) * 100) / 100;
      const amounts = Array(numberOfInstallments).fill(baseAmount);
      const remainder = roundToTwoDecimals(totalAmount - baseAmount * numberOfInstallments);
      amounts[numberOfInstallments - 1] = roundToTwoDecimals(amounts[numberOfInstallments - 1] + remainder);

      const amountById = new Map();
      linkedExpenses.forEach((expense, index) => {
        amountById.set(expense.id, amounts[index]);
      });

      state.expenses = state.expenses.map(expense => {
        if (!linkedIds.has(expense.id)) return expense;

        return {
          ...expense,
          amount: amountById.get(expense.id),
          originalAmount: roundToTwoDecimals(totalAmount)
        };
      });
    }

    const updatedIndex = state.expenses.findIndex(expense => expense.id === id);
    if (updatedIndex !== -1) {
      state.expenses[updatedIndex] = {
        ...state.expenses[updatedIndex],
        amount: redistributeAmount ? state.expenses[updatedIndex].amount : roundToTwoDecimals(amount),
        category: applyTextToAll ? state.expenses[updatedIndex].category : category,
        date,
        month: getMonthFromDate(date),
        paymentMethod: applyTextToAll ? state.expenses[updatedIndex].paymentMethod : paymentMethod,
        description: applyTextToAll ? state.expenses[updatedIndex].description : description,
        originalAmount: redistributeAmount
          ? state.expenses[updatedIndex].originalAmount
          : Number(document.getElementById(`editOriginalAmount-${id}`)?.value || getMultiTotalAmount(existingExpense))
      };
    }
  }

  editingExpenseId = null;
  saveState();
  renderAll();
}

function duplicateExpense(id) {
  const expense = state.expenses.find(item => item.id === id);
  if (!expense) {
    alert("Spesa non trovata.");
    return;
  }

  const today = getTodayDateString();
  const duplicatedExpense = {
    ...expense,
    id: createId(),
    date: today,
    month: getMonthFromDate(today),
    description: expense.description || "Spesa duplicata"
  };

  if (duplicatedExpense.type === "multi") {
    duplicatedExpense.type = "single";
    delete duplicatedExpense.groupId;
    delete duplicatedExpense.originalAmount;
    delete duplicatedExpense.installmentNumber;
    delete duplicatedExpense.installmentTotal;
  }

  state.expenses.push(duplicatedExpense);
  syncExpensesDateRangeWithMonth(duplicatedExpense.month);
  editingExpenseId = duplicatedExpense.id;
  editingReimbursementId = null;

  saveState();
  showView("expensesView");
  renderExpensesList();
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

  document.querySelectorAll("[data-category-limit]").forEach(input => {
    const category = input.dataset.categoryLimit;
    state.thresholds.categoryLimits[category] = Number(input.value || 0);
  });

  syncTotalLimitWithCategories();
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
  syncTotalLimitWithCategories();
  input.value = "";

  saveState();
  renderAll();
}

function renameCategory(oldName) {
  const inputs = [...document.querySelectorAll("[data-category-old-name]")];
  const input = inputs.find(element => element.dataset.categoryOldName === oldName);

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

  syncTotalLimitWithCategories();
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
  syncTotalLimitWithCategories();

  saveState();
  renderAll();
}

function showView(viewId) {
  if (viewId === "dashboardView") {
    state.selectedMonth = getCurrentMonth();
  }

  if (viewId === "addView") {
    setDefaultDate();
  }

  if (viewId === "expensesView") {
    resetExpenseCategoryFilterToAll();
  }

  document.querySelectorAll(".view").forEach(view => {
    view.classList.remove("active");
  });

  document.getElementById(viewId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" });

  document.querySelectorAll(".bottom-nav button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });

  if (viewId === "dashboardView") {
    renderDashboard();
    saveState();
  }

  if (viewId === "expensesView") {
    renderExpensesList();
  }

  if (viewId === "reportView") {
    resetMultiReportCategoryFilterToAll();
    renderReport();
    renderMultiReport();
  }
}


function exportCsv() {
  const expenses = filterByExpenseDescriptionSearch(filterBySelectedExpenseCategories(
    getExpensesForDateRange(state.selectedExpensesDateFrom, state.selectedExpensesDateTo)
  ));

  const genericReimbursements = filterByExpenseDescriptionSearch(filterBySelectedExpenseCategories(
    getGenericReimbursementsForDateRange(state.selectedExpensesDateFrom, state.selectedExpensesDateTo)
  ));

  if (expenses.length === 0 && genericReimbursements.length === 0) {
    alert("Non ci sono spese o rimborsi da esportare per il periodo selezionato.");
    return;
  }

  const header = [
    "Data",
    "Mese",
    "Categoria",
    "Metodo pagamento",
    "Descrizione",
    "Importo",
    "Rileva budget",
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
    isVoucherExpense(expense) ? "No" : "Sì",
    expense.type === "multi" ? "Plurimensile" : "Singola",
    expense.type === "multi" ? `${expense.installmentNumber}/${expense.installmentTotal}` : ""
  ]);

  const genericReimbursementRows = genericReimbursements.map(reimbursement => [
    reimbursement.date,
    reimbursement.month,
    reimbursement.category,
    "Rimborso generico",
    reimbursement.description,
    -Math.abs(Number(reimbursement.amount || 0)),
    "Riduce budget",
    "Rimborso generico",
    ""
  ]);

  rows.push(...genericReimbursementRows);

  const csv = [header, ...rows]
    .map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const fileFrom = state.selectedExpensesDateFrom || "inizio";
  const fileTo = state.selectedExpensesDateTo || "fine";

  const link = document.createElement("a");
  link.href = url;
  link.download = `spese-${fileFrom}-${fileTo}.csv`;
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
  const file = event.target.files && event.target.files[0];
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

function escapeAttributeForHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
const homeMonthSelect = document.getElementById("homeMonthSelect");
if (homeMonthSelect) {
  homeMonthSelect.addEventListener("change", event => {
    state.selectedMonth = event.target.value;
    saveState();
    renderDashboard();
  });
}
const multiReportReferenceMonth = document.getElementById("multiReportReferenceMonth");
if (multiReportReferenceMonth) {
  multiReportReferenceMonth.addEventListener("change", event => {
    state.selectedMultiReportReferenceMonth = event.target.value || getCurrentMonth();
    saveState();
    renderMultiReport();
  });
}
const multiReportMonthsBefore = document.getElementById("multiReportMonthsBefore");
if (multiReportMonthsBefore) {
  multiReportMonthsBefore.addEventListener("change", event => {
    state.selectedMultiReportMonthsBefore = Number(event.target.value || 0);
    saveState();
    renderMultiReport();
  });
}

const multiReportMonthsAfter = document.getElementById("multiReportMonthsAfter");
if (multiReportMonthsAfter) {
  multiReportMonthsAfter.addEventListener("change", event => {
    state.selectedMultiReportMonthsAfter = Number(event.target.value || 0);
    saveState();
    renderMultiReport();
  });
}

const multiReportCurrentButton = document.getElementById("multiReportCurrentButton");
if (multiReportCurrentButton) {
  multiReportCurrentButton.addEventListener("click", () => {
    state.selectedMultiReportReferenceMonth = getCurrentMonth();
    state.selectedMultiReportMonthsBefore = 0;
    state.selectedMultiReportMonthsAfter = 0;
    saveState();
    renderMultiReport();
  });
}
const expensesMonthSelect = document.getElementById("expensesMonthSelect");
if (expensesMonthSelect) {
  expensesMonthSelect.addEventListener("change", event => {
    if (event.target.value === "__custom__") return;
    syncExpensesDateRangeWithMonth(event.target.value);
    saveState();
    renderExpensesList();
  });
}

const applyExpensesPeriodButton = document.getElementById("applyExpensesPeriodButton");
if (applyExpensesPeriodButton) {
  applyExpensesPeriodButton.addEventListener("click", () => {
    const fromInput = document.getElementById("expensesDateFrom");
    const toInput = document.getElementById("expensesDateTo");

    state.selectedExpensesDateFrom = fromInput ? fromInput.value : "";
    state.selectedExpensesDateTo = toInput ? toInput.value : "";

    if (state.selectedExpensesDateFrom && state.selectedExpensesDateTo && state.selectedExpensesDateFrom > state.selectedExpensesDateTo) {
      alert("La data iniziale non può essere successiva alla data finale.");
      renderExpensesList();
      return;
    }

    if (state.selectedExpensesDateFrom && state.selectedExpensesDateTo && getMonthFromDate(state.selectedExpensesDateFrom) === getMonthFromDate(state.selectedExpensesDateTo)) {
      state.selectedExpensesMonth = getMonthFromDate(state.selectedExpensesDateFrom);
    }

    saveState();
    renderExpensesList();
  });
}

const currentExpensesMonthButton = document.getElementById("currentExpensesMonthButton");
if (currentExpensesMonthButton) {
  currentExpensesMonthButton.addEventListener("click", () => {
    syncExpensesDateRangeWithMonth(getCurrentMonth());
    saveState();
    renderExpensesList();
  });
}

const selectAllExpenseCategoriesButton = document.getElementById("selectAllExpenseCategoriesButton");
if (selectAllExpenseCategoriesButton) {
  selectAllExpenseCategoriesButton.addEventListener("click", selectAllExpenseCategories);
}

const selectNoExpenseCategoriesButton = document.getElementById("selectNoExpenseCategoriesButton");
if (selectNoExpenseCategoriesButton) {
  selectNoExpenseCategoriesButton.addEventListener("click", selectNoExpenseCategories);
}

const applyExpenseDescriptionSearchButton = document.getElementById("applyExpenseDescriptionSearchButton");
if (applyExpenseDescriptionSearchButton) {
  applyExpenseDescriptionSearchButton.addEventListener("click", applyExpenseDescriptionSearch);
}

const clearExpenseDescriptionSearchButton = document.getElementById("clearExpenseDescriptionSearchButton");
if (clearExpenseDescriptionSearchButton) {
  clearExpenseDescriptionSearchButton.addEventListener("click", clearExpenseDescriptionSearch);
}

const expenseDescriptionSearchInput = document.getElementById("expenseDescriptionSearchInput");
if (expenseDescriptionSearchInput) {
  expenseDescriptionSearchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyExpenseDescriptionSearch();
    }
  });
}

const selectAllMultiReportCategoriesButton = document.getElementById("selectAllMultiReportCategoriesButton");
if (selectAllMultiReportCategoriesButton) {
  selectAllMultiReportCategoriesButton.addEventListener("click", selectAllMultiReportCategories);
}

const selectNoMultiReportCategoriesButton = document.getElementById("selectNoMultiReportCategoriesButton");
if (selectNoMultiReportCategoriesButton) {
  selectNoMultiReportCategoriesButton.addEventListener("click", selectNoMultiReportCategories);
}


document.getElementById("reportMonthSelect").addEventListener("change", event => {
  state.selectedReportMonth = event.target.value;
  saveState();
  renderReport();
});
const prevMonthButton = document.getElementById("prevMonthButton");
if (prevMonthButton) {
  prevMonthButton.addEventListener("click", () => shiftSelectedMonth(-1));
}

const nextMonthButton = document.getElementById("nextMonthButton");
if (nextMonthButton) {
  nextMonthButton.addEventListener("click", () => shiftSelectedMonth(1));
}

document.getElementById("isMultiMonth").addEventListener("change", event => {
  document.getElementById("multiMonthOptions").classList.toggle("hidden", !event.target.checked);
});

const isGenericReimbursement = document.getElementById("isGenericReimbursement");
if (isGenericReimbursement) {
  isGenericReimbursement.addEventListener("change", event => {
    if (!event.target.checked) {
      resetReimbursementSourceMode();
    }
    updateGenericReimbursementMode();
  });
}


try {
  document.getElementById("appVersion").textContent = APP_VERSION;
  syncTotalLimitWithCategories();
  state.selectedMonth = getCurrentMonth();
  setDefaultDate();
  renderAll();
  renderMultiReport();
  registerServiceWorker();
} catch (error) {
  console.error("Errore avvio app", error);
  alert("Errore di avvio app: " + error.message);
}
