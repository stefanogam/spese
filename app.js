const STORAGE_KEY = "spese-pwa-locale-v66";
const APP_VERSION = "V.80";
const GOOGLE_CLIENT_ID = "307678452072-ggt9vfsaamel3i0lma1sb8vjug6p33so.apps.googleusercontent.com";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_DRIVE_BACKUP_FILE_NAME = "spese-pwa-backup.json";
const LOCAL_BACKUP_KEY = "spese-pwa-locale-last-json-backup";
const BACKUP_STATUS_KEY = "spese-pwa-locale-backup-status";

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

const paymentMethods = ["Contanti", "Carta", "Bancomat", "Bonifico", "Voucher", "Altro"];
let paymentSplitRows = [];

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
  selectedFamilyBudgetReferenceMonth: getCurrentMonth(),
  selectedFamilyBudgetMonthsBefore: 0,
  selectedFamilyBudgetMonthsAfter: 12,
  lastBackupDate: "",
  incomes: [],
  categories: [...defaultCategories],
  categorySettings: {},
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
let editingIncomeId = null;
let reimbursementSourceExpenseId = null;
let googleDriveTokenClient = null;
let googleDriveAccessToken = "";
let googleDriveTokenExpiresAt = 0;

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeCategoryName(value) {
  return String(value || "").trim().toLowerCase();
}

function getDefaultCategorySettings(category) {
  const defaultIndex = defaultCategories.findIndex(item => normalizeCategoryName(item) === normalizeCategoryName(category));
  const order = defaultIndex >= 0 ? (defaultIndex + 1) * 10 : 999;

  if (normalizeCategoryName(category) === "vacanze") {
    return {
      splitMode: "calendar-year",
      months: 12,
      order
    };
  }

  return {
    splitMode: "none",
    months: 2,
    order
  };
}

function normalizeCategorySettings(settings, category) {
  const fallback = getDefaultCategorySettings(category);
  const splitMode = ["none", "custom-months", "calendar-year"].includes(settings?.splitMode)
    ? settings.splitMode
    : fallback.splitMode;
  const months = Math.max(2, Math.min(12, Number(settings?.months || fallback.months || 2)));
  const order = Number(settings?.order ?? fallback.order);

  return {
    splitMode,
    months: splitMode === "calendar-year" ? 12 : months,
    order: Number.isFinite(order) ? order : fallback.order
  };
}

function getCategorySettings(category) {
  if (!state.categorySettings) {
    state.categorySettings = {};
  }

  if (!state.categorySettings[category]) {
    state.categorySettings[category] = getDefaultCategorySettings(category);
  }

  state.categorySettings[category] = normalizeCategorySettings(state.categorySettings[category], category);
  return state.categorySettings[category];
}

function getOrderedCategories() {
  return [...state.categories].sort((a, b) => {
    const settingsA = getCategorySettings(a);
    const settingsB = getCategorySettings(b);
    return Number(settingsA.order || 999) - Number(settingsB.order || 999) || a.localeCompare(b, "it");
  });
}

function sortCategoriesByOrder() {
  state.categories = getOrderedCategories();
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const oldSaved = localStorage.getItem("spese-pwa-locale-v65") || localStorage.getItem("spese-pwa-locale-v64") || localStorage.getItem("spese-pwa-locale-v63") || localStorage.getItem("spese-pwa-locale-v62") || localStorage.getItem("spese-pwa-locale-v61") || localStorage.getItem("spese-pwa-locale-v60") || localStorage.getItem("spese-pwa-locale-v59") || localStorage.getItem("spese-pwa-locale-v58") || localStorage.getItem("spese-pwa-locale-v57") || localStorage.getItem("spese-pwa-locale-v56") || localStorage.getItem("spese-pwa-locale-v55") || localStorage.getItem("spese-pwa-locale-v54") || localStorage.getItem("spese-pwa-locale-v53") || localStorage.getItem("spese-pwa-locale-v52") || localStorage.getItem("spese-pwa-locale-v51") || localStorage.getItem("spese-pwa-locale-v50") || localStorage.getItem("spese-pwa-locale-v49") || localStorage.getItem("spese-pwa-locale-v48") || localStorage.getItem("spese-pwa-locale-v47") || localStorage.getItem("spese-pwa-locale-v46") || localStorage.getItem("spese-pwa-locale-v45") || localStorage.getItem("spese-pwa-locale-v44") || localStorage.getItem("spese-pwa-locale-v43") || localStorage.getItem("spese-pwa-locale-v42") || localStorage.getItem("spese-pwa-locale-v41") || localStorage.getItem("spese-pwa-locale-v40") || localStorage.getItem("spese-pwa-locale-v39") || localStorage.getItem("spese-pwa-locale-v38") || localStorage.getItem("spese-pwa-locale-v37") || localStorage.getItem("spese-pwa-locale-v36") || localStorage.getItem("spese-pwa-locale-v35") || localStorage.getItem("spese-pwa-locale-v34") || localStorage.getItem("spese-pwa-locale-v33") || localStorage.getItem("spese-pwa-locale-v32") || localStorage.getItem("spese-pwa-locale-v31") || localStorage.getItem("spese-pwa-locale-v30") || localStorage.getItem("spese-pwa-locale-v29") || localStorage.getItem("spese-pwa-locale-v28") || localStorage.getItem("spese-pwa-locale-v27") || localStorage.getItem("spese-pwa-locale-v26") || localStorage.getItem("spese-pwa-locale-v25") || localStorage.getItem("spese-pwa-locale-v24") || localStorage.getItem("spese-pwa-locale-v23") || localStorage.getItem("spese-pwa-locale-v22") || localStorage.getItem("spese-pwa-locale-v21") || localStorage.getItem("spese-pwa-locale-v20") || localStorage.getItem("spese-pwa-locale-v19") || localStorage.getItem("spese-pwa-locale-v18") || localStorage.getItem("spese-pwa-locale-v17") || localStorage.getItem("spese-pwa-locale-v16") || localStorage.getItem("spese-pwa-locale-v15") || localStorage.getItem("spese-pwa-locale-v14") || localStorage.getItem("spese-pwa-locale-v13") || localStorage.getItem("spese-pwa-locale-v12") || localStorage.getItem("spese-pwa-locale-v11") || localStorage.getItem("spese-pwa-locale-v10") || localStorage.getItem("spese-pwa-locale-v9") || localStorage.getItem("spese-pwa-locale-v8") || localStorage.getItem("spese-pwa-locale-v7") || localStorage.getItem("spese-pwa-locale-v6") || localStorage.getItem("spese-pwa-locale-v5") || localStorage.getItem("spese-pwa-locale-v4") || localStorage.getItem("spese-pwa-locale-v3") || localStorage.getItem("spese-pwa-locale-v2") || localStorage.getItem("spese-pwa-locale-v1");
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
    selectedFamilyBudgetReferenceMonth: rawState.selectedFamilyBudgetReferenceMonth || getCurrentMonth(),
    selectedFamilyBudgetMonthsBefore: Number(rawState.selectedFamilyBudgetMonthsBefore ?? 0),
    selectedFamilyBudgetMonthsAfter: Number(rawState.selectedFamilyBudgetMonthsAfter ?? 12),
    lastBackupDate: rawState.lastBackupDate || "",
    incomes: Array.isArray(rawState.incomes) ? rawState.incomes : [],
    categories: rawState.categories || [...defaultCategories],
    categorySettings: rawState.categorySettings && typeof rawState.categorySettings === "object" ? rawState.categorySettings : {},
    expenses: Array.isArray(rawState.expenses) ? rawState.expenses : [],
    reimbursements: Array.isArray(rawState.reimbursements) ? rawState.reimbursements : [],
    thresholds: rawState.thresholds || structuredClone(initialState.thresholds)
  };

  if (!migrated.thresholds.categoryLimits) {
    migrated.thresholds.categoryLimits = {};
  }

  migrated.categories.forEach((category, index) => {
    if (migrated.thresholds.categoryLimits[category] === undefined) {
      migrated.thresholds.categoryLimits[category] = 0;
    }

    if (!migrated.categorySettings[category]) {
      migrated.categorySettings[category] = getDefaultCategorySettings(category);
    } else {
      migrated.categorySettings[category] = normalizeCategorySettings(migrated.categorySettings[category], category);
    }

    if (migrated.categorySettings[category].order === undefined) {
      migrated.categorySettings[category].order = (index + 1) * 10;
    }
  });

  Object.keys(migrated.categorySettings).forEach(category => {
    if (!migrated.categories.includes(category)) {
      delete migrated.categorySettings[category];
    }
  });

  migrated.expenses = migrated.expenses.map(expense => {
    const amount = roundToTwoDecimals(Number(expense.amount || 0));
    const paymentBreakdown = Array.isArray(expense.paymentBreakdown) && expense.paymentBreakdown.length > 0
      ? normalizePaymentBreakdown(expense.paymentBreakdown, amount)
      : [{ method: expense.paymentMethod || "Bancomat", amount }];

    return {
      ...expense,
      amount,
      createdAt: expense.createdAt || expense.insertedAt || expense.date || new Date().toISOString(),
      month: expense.month || getMonthFromDate(expense.date),
      type: expense.type || "single",
      paymentMethod: getPaymentMethodLabel(paymentBreakdown),
      paymentBreakdown
    };
  });

  migrated.reimbursements = migrated.reimbursements.map(reimbursement => ({
    id: reimbursement.id || createId(),
    amount: roundToTwoDecimals(Number(reimbursement.amount || 0)),
    category: reimbursement.category || "Altro",
    date: reimbursement.date || getTodayDateString(),
    month: reimbursement.month || getMonthFromDate(reimbursement.date || getTodayDateString()),
    description: reimbursement.description || ""
  })).filter(reimbursement => reimbursement.amount > 0);

  migrated.incomes = migrated.incomes.map(income => ({
    id: income.id || createId(),
    amount: roundToTwoDecimals(Number(income.amount || 0)),
    month: income.month || getCurrentMonth(),
    description: income.description || "Entrata"
  })).filter(income => income.amount > 0);

  migrated.thresholds.totalLimit = migrated.categories.reduce((sum, category) => {
    return sum + Number(migrated.thresholds.categoryLimits[category] || 0);
  }, 0);

  migrated.categories = [...migrated.categories].sort((a, b) => {
    const settingsA = migrated.categorySettings[a] || getDefaultCategorySettings(a);
    const settingsB = migrated.categorySettings[b] || getDefaultCategorySettings(b);
    return Number(settingsA.order || 999) - Number(settingsB.order || 999) || a.localeCompare(b, "it");
  });

  return migrated;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function showAppModal({ title, message, contentHtml = "", actions }) {
  return new Promise(resolve => {
    const modal = document.getElementById("appModal");
    const titleElement = document.getElementById("appModalTitle");
    const messageElement = document.getElementById("appModalMessage");
    const actionsElement = document.getElementById("appModalActions");

    if (!modal || !titleElement || !messageElement || !actionsElement) {
      resolve(actions?.[0]?.value ?? true);
      return;
    }

    titleElement.textContent = title;
    if (contentHtml) {
      messageElement.innerHTML = contentHtml;
    } else {
      messageElement.textContent = message;
    }
    actionsElement.innerHTML = "";

    actions.forEach(action => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      if (action.className) button.className = action.className;
      button.addEventListener("click", () => {
        modal.classList.add("hidden");
        actionsElement.innerHTML = "";
        resolve(action.value);
      }, { once: true });
      actionsElement.appendChild(button);
    });

    modal.classList.remove("hidden");
  });
}

function appAlert(message, title = "Avviso") {
  return showAppModal({
    title,
    message,
    actions: [{ label: "OK", value: true }]
  });
}

function appConfirm(message, title = "Conferma") {
  return showAppModal({
    title,
    message,
    actions: [
      { label: "Conferma", value: true },
      { label: "Annulla", value: false, className: "secondary" }
    ]
  });
}

function renderMonthPickerButton(buttonId, month, fallbackText = "Seleziona mese") {
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.textContent = month ? getMonthLabel(month) : fallbackText;
}

function getMonthPickerYears(selectedMonth = getCurrentMonth()) {
  const selectedYear = Number((selectedMonth || getCurrentMonth()).slice(0, 4));
  const years = new Set([selectedYear, new Date().getFullYear()]);
  state.expenses.forEach(expense => {
    if (expense.month) years.add(Number(expense.month.slice(0, 4)));
  });
  state.incomes.forEach(income => {
    if (income.month) years.add(Number(income.month.slice(0, 4)));
  });
  for (let offset = -2; offset <= 2; offset++) {
    years.add(selectedYear + offset);
  }
  return [...years].filter(Number.isFinite).sort((a, b) => b - a);
}

function showMonthPicker({ title = "Seleziona mese", selectedMonth = getCurrentMonth(), onSelect }) {
  const current = selectedMonth || getCurrentMonth();
  const selectedYear = Number(current.slice(0, 4));
  const selectedMonthNumber = Number(current.slice(5, 7));
  const monthNames = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return {
      month,
      label: getMonthLabel(`${selectedYear}-${month}`).replace(` ${selectedYear}`, "")
    };
  });

  const contentHtml = `
    <div class="month-picker">
      <label>
        Anno
        <select id="monthPickerYear">
          ${getMonthPickerYears(current).map(year => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`).join("")}
        </select>
      </label>
      <div class="month-picker-grid">
        ${monthNames.map(item => `
          <button
            type="button"
            class="secondary month-picker-option ${Number(item.month) === selectedMonthNumber ? "active" : ""}"
            data-month-value="${item.month}"
          >
            ${escapeHtml(item.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  return new Promise(resolve => {
    showAppModal({
      title,
      contentHtml,
      actions: [{ label: "Annulla", value: null, className: "secondary" }]
    }).then(resolve);

    setTimeout(() => {
      document.querySelectorAll(".month-picker-option").forEach(button => {
        button.addEventListener("click", () => {
          const year = document.getElementById("monthPickerYear")?.value || String(selectedYear);
          const month = `${year}-${button.dataset.monthValue}`;
          document.getElementById("appModal")?.classList.add("hidden");
          document.getElementById("appModalActions").innerHTML = "";
          if (typeof onSelect === "function") onSelect(month);
          resolve(month);
        }, { once: true });
      });
    }, 0);
  });
}

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


function roundPaymentBreakdownForTotal(paymentBreakdown, totalAmount) {
  const normalized = (paymentBreakdown || [])
    .map(item => ({
      method: item.method || "Altro",
      amount: roundToTwoDecimals(Number(item.amount || 0))
    }))
    .filter(item => item.amount > 0);

  const total = roundToTwoDecimals(Number(totalAmount || 0));

  if (normalized.length === 0) {
    return [{ method: "Bancomat", amount: total }];
  }

  const currentTotal = roundToTwoDecimals(normalized.reduce((sum, item) => sum + item.amount, 0));
  const difference = roundToTwoDecimals(total - currentTotal);

  if (Math.abs(difference) >= 0.01) {
    normalized[normalized.length - 1].amount = roundToTwoDecimals(normalized[normalized.length - 1].amount + difference);
  }

  return normalized.filter(item => item.amount > 0);
}

function normalizePaymentBreakdown(paymentBreakdown, totalAmount) {
  return roundPaymentBreakdownForTotal(paymentBreakdown, totalAmount);
}

function getPaymentMethodLabel(paymentBreakdown) {
  const validRows = (paymentBreakdown || []).filter(row => Number(row.amount || 0) > 0);
  if (validRows.length === 0) return "Bancomat";
  if (validRows.length === 1) return validRows[0].method || "Altro";
  return "Pagamento misto";
}

function getPaymentBreakdown(expense) {
  if (Array.isArray(expense.paymentBreakdown) && expense.paymentBreakdown.length > 0) {
    return normalizePaymentBreakdown(expense.paymentBreakdown, expense.amount);
  }

  return [{
    method: expense.paymentMethod || "Bancomat",
    amount: roundToTwoDecimals(Number(expense.amount || 0))
  }];
}

function getVoucherAmount(expense) {
  return roundToTwoDecimals(getPaymentBreakdown(expense).reduce((sum, row) => {
    return sum + (String(row.method || "").toLowerCase() === "voucher" ? Number(row.amount || 0) : 0);
  }, 0));
}

function getBudgetRelevantAmount(expense) {
  return roundToTwoDecimals(Math.max(0, Number(expense.amount || 0) - getVoucherAmount(expense)));
}

function getPaymentBreakdownText(expense) {
  return getPaymentBreakdown(expense)
    .map(row => `${escapeHtml(row.method)} ${formatCurrency(row.amount)}`)
    .join(" · ");
}

function splitPaymentBreakdownForInstallment(paymentBreakdown, installmentAmount, totalAmount) {
  const total = Number(totalAmount || 0);
  const amount = roundToTwoDecimals(Number(installmentAmount || 0));

  if (!total || total <= 0) {
    return [{ method: "Bancomat", amount }];
  }

  const rows = getPaymentBreakdown({ paymentBreakdown, amount: total });
  const splitRows = rows.map(row => ({
    method: row.method,
    amount: Math.floor(((Number(row.amount || 0) / total) * amount) * 100) / 100
  }));

  const currentTotal = roundToTwoDecimals(splitRows.reduce((sum, row) => sum + row.amount, 0));
  const difference = roundToTwoDecimals(amount - currentTotal);

  if (splitRows.length > 0) {
    splitRows[splitRows.length - 1].amount = roundToTwoDecimals(splitRows[splitRows.length - 1].amount + difference);
  }

  return splitRows.filter(row => row.amount > 0);
}

function getPaymentMethodOptions(selectedMethod = "Bancomat") {
  return paymentMethods.map(method => `
    <option value="${escapeAttributeForHtml(method)}" ${method === selectedMethod ? "selected" : ""}>
      ${escapeHtml(method)}
    </option>
  `).join("");
}

function isPaymentSplitModeActive() {
  const splitBox = document.getElementById("paymentSplitBox");
  return Boolean(splitBox && !splitBox.classList.contains("hidden"));
}

function showPaymentSplitModeFromSingle() {
  const amountInput = document.getElementById("amount");
  const singleMethod = document.getElementById("paymentMethod")?.value || "Bancomat";
  const totalAmount = amountInput?.value || "";

  paymentSplitRows = [
    { id: createId(), method: singleMethod, amount: totalAmount },
    { id: createId(), method: "Bancomat", amount: "" }
  ];

  const singleBox = document.getElementById("singlePaymentMethodBox");
  const splitBox = document.getElementById("paymentSplitBox");

  if (singleBox) singleBox.classList.add("hidden");
  if (splitBox) splitBox.classList.remove("hidden");

  renderPaymentSplitRows();
}

function hidePaymentSplitMode() {
  const singleBox = document.getElementById("singlePaymentMethodBox");
  const splitBox = document.getElementById("paymentSplitBox");

  if (singleBox) singleBox.classList.remove("hidden");
  if (splitBox) splitBox.classList.add("hidden");

  paymentSplitRows = [];
}

function renderPaymentSplitRows() {
  const container = document.getElementById("paymentSplitRows");
  if (!container) return;

  if (!Array.isArray(paymentSplitRows) || paymentSplitRows.length === 0) {
    paymentSplitRows = [{ id: createId(), method: "Bancomat", amount: "" }];
  }

  container.innerHTML = paymentSplitRows.map((row, index) => `
    <div class="payment-split-row" data-row-id="${escapeAttributeForHtml(row.id)}">
      <select class="payment-split-method" aria-label="Metodo pagamento">
        ${getPaymentMethodOptions(row.method)}
      </select>
      <input class="payment-split-amount" type="number" step="0.01" min="0" placeholder="Importo" value="${escapeAttributeForHtml(row.amount ?? "")}" aria-label="Importo metodo pagamento" />
      <button class="secondary small payment-remove-button" type="button" onclick="removePaymentSplitRow('${escapeAttributeForHtml(row.id)}')" ${paymentSplitRows.length === 1 ? "disabled" : ""}>-</button>
    </div>
  `).join("");
}

function syncPaymentSplitRowsFromDom() {
  const rows = [...document.querySelectorAll("#paymentSplitRows .payment-split-row")];
  if (rows.length === 0) return;

  paymentSplitRows = rows.map(row => ({
    id: row.dataset.rowId || createId(),
    method: row.querySelector(".payment-split-method")?.value || "Altro",
    amount: row.querySelector(".payment-split-amount")?.value || ""
  }));
}

function addPaymentSplitRow() {
  syncPaymentSplitRowsFromDom();
  paymentSplitRows.push({ id: createId(), method: "Bancomat", amount: "" });
  renderPaymentSplitRows();
}

function removePaymentSplitRow(id) {
  syncPaymentSplitRowsFromDom();
  paymentSplitRows = paymentSplitRows.filter(row => row.id !== id);

  if (paymentSplitRows.length === 0) {
    paymentSplitRows = [{ id: createId(), method: "Bancomat", amount: "" }];
  }

  renderPaymentSplitRows();
}

function resetPaymentSplitRows(totalAmount = "") {
  hidePaymentSplitMode();
  const amountInput = document.getElementById("amount");
  if (amountInput && totalAmount) amountInput.value = String(totalAmount);
}

function collectPaymentBreakdownFromForm(totalAmount) {
  const total = roundToTwoDecimals(Number(totalAmount || 0));

  if (!isPaymentSplitModeActive()) {
    const method = document.getElementById("paymentMethod")?.value || "Bancomat";
    return [{ method, amount: total }];
  }

  const rows = [...document.querySelectorAll("#paymentSplitRows .payment-split-row")];
  const breakdown = rows.map(row => ({
    method: row.querySelector(".payment-split-method")?.value || "Altro",
    amount: roundToTwoDecimals(Number(row.querySelector(".payment-split-amount")?.value || 0))
  })).filter(row => row.amount > 0);

  if (breakdown.length === 0) {
    alert("Inserisci almeno un metodo di pagamento con importo maggiore di zero.");
    return null;
  }

  const methodsTotal = roundToTwoDecimals(breakdown.reduce((sum, row) => sum + row.amount, 0));

  if (Math.abs(methodsTotal - total) >= 0.01) {
    alert(`La somma dei metodi di pagamento è ${formatCurrency(methodsTotal)}, ma l'importo totale è ${formatCurrency(total)}.`);
    return null;
  }

  return breakdown;
}

function getEditPaymentBreakdownRows(id) {
  const rows = [...document.querySelectorAll(`#editPaymentSplitRows-${CSS.escape(id)} .payment-split-row`)];
  return rows.map(row => ({
    method: row.querySelector(".payment-split-method")?.value || "Altro",
    amount: roundToTwoDecimals(Number(row.querySelector(".payment-split-amount")?.value || 0))
  })).filter(row => row.amount > 0);
}

function addEditPaymentSplitRow(id) {
  const container = document.getElementById(`editPaymentSplitRows-${id}`);
  if (!container) return;

  const rowId = createId();
  container.insertAdjacentHTML("beforeend", renderEditPaymentSplitRow(id, { id: rowId, method: "Bancomat", amount: "" }, false));
  updateEditPaymentRemoveButtons(id);
}

function removeEditPaymentSplitRow(id, rowId) {
  const container = document.getElementById(`editPaymentSplitRows-${id}`);
  if (!container) return;

  const row = container.querySelector(`[data-row-id="${CSS.escape(rowId)}"]`);
  if (row) row.remove();

  updateEditPaymentRemoveButtons(id);
}

function updateEditPaymentRemoveButtons(id) {
  const rows = [...document.querySelectorAll(`#editPaymentSplitRows-${CSS.escape(id)} .payment-split-row`)];
  rows.forEach(row => {
    const button = row.querySelector(".payment-remove-button");
    if (button) button.disabled = rows.length === 1;
  });
}

function renderEditPaymentSplitRow(expenseId, row, disabled = false) {
  const rowId = row.id || createId();
  return `
    <div class="payment-split-row" data-row-id="${escapeAttributeForHtml(rowId)}">
      <select class="payment-split-method" aria-label="Metodo pagamento" ${disabled ? "disabled" : ""}>
        ${getPaymentMethodOptions(row.method)}
      </select>
      <input class="payment-split-amount" type="number" step="0.01" min="0" placeholder="Importo" value="${Number(row.amount || 0)}" aria-label="Importo metodo pagamento" ${disabled ? "readonly" : ""} />
      <button class="secondary small payment-remove-button" type="button" onclick="removeEditPaymentSplitRow('${escapeAttributeForHtml(expenseId)}', '${escapeAttributeForHtml(rowId)}')" ${disabled ? "disabled" : ""}>-</button>
    </div>
  `;
}

function getTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

function isVoucherExpense(expense) {
  return getVoucherAmount(expense) >= Number(expense.amount || 0) && Number(expense.amount || 0) > 0;
}

function hasVoucherAmount(expense) {
  return getVoucherAmount(expense) > 0;
}

function getBudgetRelevantExpenses(expenses) {
  return expenses.filter(expense => getBudgetRelevantAmount(expense) > 0);
}

function getVoucherExpenses(expenses) {
  return expenses.filter(expense => hasVoucherAmount(expense));
}

function getBudgetRelevantTotal(expenses) {
  return roundToTwoDecimals(expenses.reduce((sum, expense) => sum + getBudgetRelevantAmount(expense), 0));
}

function getVoucherTotal(expenses) {
  return roundToTwoDecimals(expenses.reduce((sum, expense) => sum + getVoucherAmount(expense), 0));
}

function getReimbursementTotal(expenses) {
  return getVoucherTotal(expenses);
}

function getBudgetRelevantTotalsByCategory(expenses) {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = roundToTwoDecimals((acc[expense.category] || 0) + getBudgetRelevantAmount(expense));
    return acc;
  }, {});
}

function getVoucherTotalsByCategory(expenses) {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = roundToTwoDecimals((acc[expense.category] || 0) + getVoucherAmount(expense));
    return acc;
  }, {});
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
  sortCategoriesByOrder();
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
  renderMonthPickerButton("homeMonthPickerButton", state.selectedMonth);
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
  renderLatestExpenses();
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

function getExpenseInsertedAt(expense) {
  if (expense.createdAt) return new Date(expense.createdAt).getTime();
  const dateValue = expense.date ? new Date(expense.date).getTime() : 0;
  return Number.isFinite(dateValue) ? dateValue : 0;
}

function renderLatestExpenses() {
  const container = document.getElementById("latestExpenses");
  const today = getTodayDateString();
  const sortedExpenses = [...state.expenses]
    .sort((a, b) => getExpenseInsertedAt(b) - getExpenseInsertedAt(a) || new Date(b.date) - new Date(a.date));
  const todayExpenses = sortedExpenses.filter(expense => expense.date === today);
  const otherLatestExpenses = sortedExpenses
    .filter(expense => expense.date !== today)
    .slice(0, 8);

  if (todayExpenses.length === 0 && otherLatestExpenses.length === 0) {
    container.innerHTML = `<p class="empty">Non hai ancora inserito spese.</p>`;
    return;
  }

  const todaySection = `
    <div class="latest-expense-section today-expense-section">
      <div class="latest-expense-heading">
        <strong>Spese di oggi</strong>
        <span>${todayExpenses.length}</span>
      </div>
      ${todayExpenses.length > 0
        ? todayExpenses.map(expense => renderExpenseRow(expense, true, { markToday: true })).join("")
        : `<p class="empty">Nessuna spesa con competenza oggi.</p>`}
    </div>
  `;

  const otherSection = otherLatestExpenses.length > 0
    ? `
      <div class="latest-expense-section">
        <div class="latest-expense-heading">
          <strong>Altre ultime spese</strong>
          <span>${otherLatestExpenses.length}</span>
        </div>
        ${otherLatestExpenses.map(expense => renderExpenseRow(expense, true)).join("")}
      </div>
    `
    : "";

  container.innerHTML = todaySection + otherSection;
}

function renderExpenseRow(expense, showDelete = false, options = {}) {
  const dateLabel = options.markToday && expense.date === getTodayDateString()
    ? `${expense.date} (oggi)`
    : expense.date;

  const multiInfo = expense.type === "multi"
    ? `<span><span class="badge info">Quota ${expense.installmentNumber}/${expense.installmentTotal}</span></span>`
    : "";

  const voucherAmount = getVoucherAmount(expense);
  const budgetAmount = getBudgetRelevantAmount(expense);
  const paymentInfo = getPaymentBreakdown(expense).length > 1
    ? `<span class="payment-breakdown">${getPaymentBreakdownText(expense)}</span>`
    : "";

  const voucherInfo = voucherAmount > 0
    ? `<span class="voucher-note">Voucher esclusi dal budget: ${formatCurrency(voucherAmount)}${budgetAmount > 0 ? ` · Budget: ${formatCurrency(budgetAmount)}` : ""}</span>`
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
        <span>${escapeHtml(dateLabel)} · ${escapeHtml(getPaymentMethodLabel(getPaymentBreakdown(expense)))}</span>
        ${paymentInfo}
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
    renderMonthPickerButton(
      "expensesMonthPickerButton",
      state.selectedExpensesMonth && isSelectedExpensesRangeEqualToMonth(state.selectedExpensesMonth) ? state.selectedExpensesMonth : "",
      "Periodo personalizzato"
    );
  }

  if (fromInput) fromInput.value = state.selectedExpensesDateFrom || "";
  if (toInput) toInput.value = state.selectedExpensesDateTo || "";
  updateExpensesPeriodSummary();

  if (!container) return;

  if (state.selectedExpensesDateFrom && state.selectedExpensesDateTo && state.selectedExpensesDateFrom > state.selectedExpensesDateTo) {
    container.innerHTML = `<p class="empty">La data iniziale non può essere successiva alla data finale.</p>`;
    const visibleExpensesTotal = document.getElementById("visibleExpensesTotal");
    if (visibleExpensesTotal) visibleExpensesTotal.textContent = `Totale: ${formatCurrency(0)}`;
    if (selectedTotal) selectedTotal.textContent = formatCurrency(0);
    renderGenericReimbursementsList();
    return;
  }

  const periodLabel = getExpensesPeriodLabel();

  const expenses = filterByExpenseDescriptionSearch(filterBySelectedExpenseCategories(
    getExpensesForDateRange(state.selectedExpensesDateFrom, state.selectedExpensesDateTo)
  )).sort((a, b) => new Date(b.date) - new Date(a.date));

  const visibleExpensesTotal = document.getElementById("visibleExpensesTotal");
  if (visibleExpensesTotal) {
    visibleExpensesTotal.textContent = `Totale: ${formatCurrency(getTotal(expenses))}`;
  }

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

  const visibleReimbursementsTotal = document.getElementById("visibleReimbursementsTotal");
  if (visibleReimbursementsTotal) {
    visibleReimbursementsTotal.textContent = `Totale: ${formatCurrency(getGenericReimbursementTotal(reimbursements))}`;
  }

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
    renderMonthPickerButton("reportMonthPickerButton", "", "Nessuna spesa registrata");
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
  renderMonthPickerButton("reportMonthPickerButton", state.selectedReportMonth);
}

function renderReport() {
  renderReportMonthSelect();

  const container = document.getElementById("categoryReport");
  const selectedReportMonth = state.selectedReportMonth;

  if (!selectedReportMonth) {
    container.innerHTML = `<p class="empty">Non ci sono ancora spese registrate.</p>`;
    renderCategoryTrendPanel(getCurrentMonth());
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
    renderCategoryTrendPanel(selectedReportMonth);
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
              <button
                class="report-category-link"
                type="button"
                onclick="openExpensesForReportCategory('${escapeAttribute(selectedReportMonth)}', '${escapeAttribute(category)}')"
                aria-label="Apri le spese della categoria ${escapeAttributeForHtml(category)} per ${escapeAttributeForHtml(getMonthLabel(selectedReportMonth))}"
              >
                ${escapeHtml(category)}
              </button>
              <button
                class="secondary small"
                type="button"
                onclick="selectCategoryTrend('${escapeAttribute(category)}')"
              >
                Andamento
              </button>
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
  renderCategoryTrendPanel(selectedReportMonth);
  renderMultiReport();
}

function getSelectedCategoryTrend() {
  const select = document.getElementById("categoryTrendSelect");
  const selected = select?.value || state.categories[0] || "";
  return state.categories.includes(selected) ? selected : (state.categories[0] || "");
}

function renderCategoryTrendPanel(referenceMonth = state.selectedReportMonth || getCurrentMonth()) {
  const select = document.getElementById("categoryTrendSelect");
  const summary = document.getElementById("categoryTrendSummary");
  const canvas = document.getElementById("categoryTrendChart");
  if (!select || !summary || !canvas) return;

  const currentValue = getSelectedCategoryTrend();
  select.innerHTML = state.categories
    .map(category => `<option value="${escapeAttributeForHtml(category)}" ${category === currentValue ? "selected" : ""}>${escapeHtml(category)}</option>`)
    .join("");

  const category = getSelectedCategoryTrend();
  if (!category) {
    summary.innerHTML = `<p class="empty">Aggiungi almeno una categoria per visualizzare l'andamento.</p>`;
    return;
  }

  const months = getMonthRangeAround(referenceMonth || getCurrentMonth(), 11, 0);
  const data = months.map(month => {
    const expenses = getMonthlyExpenses(month);
    const reimbursements = getGenericReimbursementsForMonth(month);
    const totals = getNetBudgetTotalsByCategory(expenses, reimbursements);
    return {
      month,
      amount: roundToTwoDecimals(Number(totals[category] || 0))
    };
  });

  const total = roundToTwoDecimals(data.reduce((sum, item) => sum + item.amount, 0));
  const average = roundToTwoDecimals(total / data.length);
  const peak = data.reduce((highest, item) => item.amount > highest.amount ? item : highest, data[0]);

  summary.innerHTML = `
    <div class="multi-summary-item">
      <span>Categoria</span>
      <strong>${escapeHtml(category)}</strong>
    </div>
    <div class="multi-summary-item">
      <span>Totale 12 mesi</span>
      <strong>${formatCurrency(total)}</strong>
    </div>
    <div class="multi-summary-item">
      <span>Media mensile</span>
      <strong>${formatCurrency(average)}</strong>
    </div>
    <div class="multi-summary-item">
      <span>Mese più alto</span>
      <strong>${escapeHtml(getMonthLabel(peak.month))} · ${formatCurrency(peak.amount)}</strong>
    </div>
  `;

  drawCategoryTrendChart(data, category);
}

function drawCategoryTrendChart(data, category) {
  const canvas = document.getElementById("categoryTrendChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const cssWidth = Math.max(760, data.length * 68 + 120);
  const cssHeight = 360;
  const pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * pixelRatio);
  canvas.height = Math.round(cssHeight * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const width = cssWidth;
  const height = cssHeight;
  const padding = { top: 54, right: 28, bottom: 70, left: 82 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map(item => item.amount), Number(state.thresholds.categoryLimits[category] || 0), 1);
  const roughStep = maxValue / 4;
  const stepBase = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
  const step = Math.ceil(roughStep / stepBase) * stepBase;
  const niceMax = Math.max(step, Math.ceil(maxValue / step) * step);

  function yScale(value) {
    return padding.top + chartHeight - (value / niceMax) * chartHeight;
  }

  function shortCurrency(value) {
    if (value >= 1000) return `${Math.round(value / 100) / 10}k €`.replace(".", ",");
    return `${Math.round(value)} €`;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#dbe3ee";
  ctx.fillStyle = "#64748b";
  ctx.lineWidth = 1;
  ctx.font = "600 12px system-ui";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i++) {
    const value = step * i;
    const y = yScale(value);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(shortCurrency(value), padding.left - 12, y);
  }

  const limit = Number(state.thresholds.categoryLimits[category] || 0);
  if (limit > 0 && limit <= niceMax) {
    const y = yScale(limit);
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#991b1b";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Soglia ${shortCurrency(limit)}`, padding.left + 8, y - 8);
  }

  const pointGap = chartWidth / Math.max(data.length - 1, 1);
  const points = data.map((item, index) => ({
    x: padding.left + index * pointGap,
    y: yScale(item.amount),
    ...item
  }));

  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  points.forEach(point => {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (point.amount > 0) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(shortCurrency(point.amount), point.x, point.y - 9);
    }

    ctx.fillStyle = "#334155";
    ctx.font = "700 11px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${point.month.slice(5, 7)}/${point.month.slice(2, 4)}`, point.x, height - padding.bottom + 20);
  });

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 17px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Andamento ${category}`, padding.left, 16);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui";
  ctx.fillText("Ultimi 12 mesi rispetto al mese selezionato", padding.left, 40);
}

function selectCategoryTrend(category) {
  const select = document.getElementById("categoryTrendSelect");
  if (select && state.categories.includes(category)) {
    select.value = category;
  }
  renderCategoryTrendPanel(state.selectedReportMonth || getCurrentMonth());
}

window.selectCategoryTrend = selectCategoryTrend;

function openExpensesForReportCategory(month, category) {
  if (!month || !category) return;

  state.selectedExpensesMonth = month;
  state.selectedExpensesDateFrom = getMonthStartDate(month);
  state.selectedExpensesDateTo = getMonthEndDate(month);
  state.selectedExpenseCategories = [category];
  state.selectedExpenseDescriptionSearch = "";
  saveState();
  showView("expensesView", { preserveExpenseFilters: true });
}

window.openExpensesForReportCategory = openExpensesForReportCategory;

function getCategoryColor(index) {
  const colors = [
    "#2563eb", "#0f766e", "#f97316", "#7c3aed",
    "#dc2626", "#0891b2", "#ca8a04", "#475569",
    "#be185d", "#16a34a", "#9333ea", "#ea580c"
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
  renderMonthPickerButton("multiReportReferenceMonthButton", state.selectedMultiReportReferenceMonth);
  renderMultiReportRangeSelectors();
  renderMultiReportCategoryFilter();

  const data = getMultiReportData();
  renderMultiReportSummary(data);
  drawMultiReportChart(data);
  renderMultiReportLegend();
  renderMultiReportTable(data);
}

function renderMultiReportSummary(data) {
  const container = document.getElementById("multiReportSummary");
  if (!container) return;

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = "";
    return;
  }

  const total = roundToTwoDecimals(data.reduce((sum, item) => sum + Number(item.total || 0), 0));
  const average = roundToTwoDecimals(total / data.length);
  const peak = data.reduce((highest, item) => Number(item.total || 0) > Number(highest.total || 0) ? item : highest, data[0]);
  const period = data.length === 1
    ? getMonthLabel(data[0].month)
    : `${getMonthLabel(data[0].month)} - ${getMonthLabel(data[data.length - 1].month)}`;

  container.innerHTML = `
    <div class="multi-summary-item">
      <span>Periodo</span>
      <strong>${escapeHtml(period)}</strong>
    </div>
    <div class="multi-summary-item">
      <span>Totale budget</span>
      <strong>${formatCurrency(total)}</strong>
    </div>
    <div class="multi-summary-item">
      <span>Media mensile</span>
      <strong>${formatCurrency(average)}</strong>
    </div>
    <div class="multi-summary-item">
      <span>Mese più alto</span>
      <strong>${escapeHtml(getMonthLabel(peak.month))} · ${formatCurrency(peak.total)}</strong>
    </div>
  `;
}

function drawMultiReportChart(data) {
  const canvas = document.getElementById("multiReportChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const selectedCategories = getSelectedMultiReportCategories();
  const monthCount = Math.max(data.length, 1);
  const cssWidth = Math.max(940, monthCount * 78 + 180);
  const cssHeight = 560;
  const pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * pixelRatio);
  canvas.height = Math.round(cssHeight * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const width = cssWidth;
  const height = cssHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 62, right: 34, bottom: 96, left: 92 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxStack = Math.max(
    ...data.map(item => selectedCategories.reduce((sum, category) => sum + Number(item.totalsByCategory[category] || 0), 0)),
    ...data.map(item => item.total),
    Number(state.thresholds.totalLimit || 0),
    1
  );

  const roughStep = maxStack / 5;
  const stepBase = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
  const step = Math.ceil(roughStep / stepBase) * stepBase;
  const niceMax = Math.max(step, Math.ceil(maxStack / step) * step);

  function yScale(value) {
    return padding.top + chartHeight - (value / niceMax) * chartHeight;
  }

  function shortCurrency(value) {
    if (value >= 1000) return `${Math.round(value / 100) / 10}k €`.replace(".", ",");
    return `${Math.round(value)} €`;
  }

  function roundedRect(x, y, rectWidth, rectHeight, radius) {
    const safeRadius = Math.min(radius, Math.abs(rectHeight) / 2, rectWidth / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, rectWidth, rectHeight, safeRadius);
  }

  ctx.strokeStyle = "#dbe3ee";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 5; i++) {
    const value = step * i;
    const y = yScale(value);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(shortCurrency(value), padding.left - 12, y);
  }

  const totalLimit = Number(state.thresholds.totalLimit || 0);
  if (totalLimit > 0 && totalLimit <= niceMax) {
    const y = yScale(totalLimit);
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#991b1b";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`Soglia ${shortCurrency(totalLimit)}`, padding.left + 8, y - 6);
  }

  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(46, groupWidth * 0.52);

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
      if (typeof ctx.roundRect === "function") {
        roundedRect(x, yTop, barWidth, Math.max(segmentHeight, 1), 5);
        ctx.fill();
      } else {
        ctx.fillRect(x, yTop, barWidth, Math.max(segmentHeight, 1));
      }
      accumulated += value;
    });

    if (accumulated === 0) {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(x, yScale(0) - 2, barWidth, 2);
    }

    const label = item.month.slice(5, 7) + "/" + item.month.slice(2, 4);
    ctx.fillStyle = "#334155";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 20);

    if (item.total > 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "600 11px system-ui";
      ctx.fillText(shortCurrency(item.total), x + barWidth / 2, height - padding.bottom + 40);
    }
  });

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
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

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (item.total > 0) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(shortCurrency(item.total), x, y - 10);
    }
  });

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 18px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Budget per categoria e totale mensile", padding.left, 18);

  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px system-ui";
  ctx.fillText("Barre: categorie selezionate · Linea: totale budget · Linea rossa: soglia mensile", padding.left, 42);
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
    <span class="legend-item">
      <span class="legend-threshold"></span>
      Soglia mensile
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
  const totalLimitInput = document.getElementById("totalLimit");
  if (totalLimitInput) totalLimitInput.value = state.thresholds.totalLimit || "";

  const container = document.getElementById("categoryLimitsForm");
  if (!container) return;
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
  sortCategoriesByOrder();

  if (state.categories.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna categoria presente.</p>`;
    return;
  }

  container.innerHTML = state.categories.map((category, index) => {
    const used = state.expenses.some(expense => expense.category === category);
    const settings = getCategorySettings(category);

    return `
      <div class="category-row">
        <div class="category-settings-row">
          <label>
            Categoria
            <input class="category-name-input" value="${escapeAttributeForHtml(category)}" data-category-index="${index}" data-category-old-name="${escapeAttributeForHtml(category)}" />
          </label>
          <label>
            Ordine
            <input type="number" step="1" value="${Number(settings.order || (index + 1) * 10)}" data-category-order="${index}" />
          </label>
          <label>
            Soglia mensile
            <input type="number" step="0.01" min="0" value="${state.thresholds.categoryLimits[category] || ""}" data-category-inline-limit="${index}" />
          </label>
          <label>
            Ripartizione predefinita
            <select data-category-split-mode="${index}" onchange="updateCategorySplitMode(${index}, this.value)">
              <option value="none" ${settings.splitMode === "none" ? "selected" : ""}>Nessuna</option>
              <option value="custom-months" ${settings.splitMode === "custom-months" ? "selected" : ""}>Mensile personalizzata</option>
              <option value="calendar-year" ${settings.splitMode === "calendar-year" ? "selected" : ""}>Annuale su anno solare</option>
            </select>
          </label>
          <label class="${settings.splitMode === "custom-months" ? "" : "hidden"}" data-category-months-box="${index}">
            Mesi
            <input type="number" min="2" max="12" step="1" value="${settings.months || 2}" data-category-split-months="${index}" onchange="updateCategorySplitMonths(${index}, this.value)" />
          </label>
        </div>
        <div class="category-actions">
          <button class="secondary small" onclick="saveCategoryByIndex(${index})">Salva</button>
          <button class="danger small" onclick="deleteCategoryByIndex(${index})" ${used ? "title='Categoria usata da alcune spese'" : ""}>Elimina</button>
        </div>
      </div>
    `;
  }).join("");
}

function updateCategorySplitMode(index, splitMode) {
  const category = state.categories[index];
  if (!category) return;

  const current = getCategorySettings(category);
  state.categorySettings[category] = normalizeCategorySettings({
    ...current,
    splitMode,
    months: splitMode === "calendar-year" ? 12 : current.months
  }, category);

  saveState();
  renderCategoriesList();
  applyCategoryDefaultSplit();
}

function updateCategorySplitMonths(index, value) {
  const category = state.categories[index];
  if (!category) return;

  const current = getCategorySettings(category);
  state.categorySettings[category] = normalizeCategorySettings({
    ...current,
    splitMode: "custom-months",
    months: Number(value || current.months || 2)
  }, category);

  saveState();
  applyCategoryDefaultSplit();
}

function saveCategoryByIndex(index) {
  const oldName = state.categories[index];
  if (!oldName) return;

  const input = document.querySelector(`[data-category-index="${index}"]`);
  const orderInput = document.querySelector(`[data-category-order="${index}"]`);
  const limitInput = document.querySelector(`[data-category-inline-limit="${index}"]`);
  if (!input) return;

  const newName = input.value.trim();
  const order = Number(orderInput?.value || getCategorySettings(oldName).order || (index + 1) * 10);
  const limit = Number(limitInput?.value || 0);

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

  if (!state.categorySettings) state.categorySettings = {};
  state.thresholds.categoryLimits[newName] = state.thresholds.categoryLimits[oldName] || 0;
  state.categorySettings[newName] = state.categorySettings[oldName] || getDefaultCategorySettings(newName);
  state.categorySettings[newName] = normalizeCategorySettings(state.categorySettings[newName], newName);
  state.categorySettings[newName] = normalizeCategorySettings({
    ...state.categorySettings[newName],
    order: Number.isFinite(order) ? order : (index + 1) * 10
  }, newName);
  state.thresholds.categoryLimits[newName] = Number.isFinite(limit) ? limit : 0;

  if (newName !== oldName) {
    delete state.thresholds.categoryLimits[oldName];
    delete state.categorySettings[oldName];
  }

  sortCategoriesByOrder();
  syncTotalLimitWithCategories();
  sortCategoriesByOrder();
  saveState();
  renderAll();
}

const renameCategoryByIndex = saveCategoryByIndex;

function deleteCategoryByIndex(index) {
  const categoryName = state.categories[index];
  if (!categoryName) return;
  deleteCategory(categoryName);
}


function getFamilyBudgetMonths() {
  const referenceMonth = state.selectedFamilyBudgetReferenceMonth || getCurrentMonth();
  const monthsBefore = Math.min(Math.max(Number(state.selectedFamilyBudgetMonthsBefore || 0), 0), 12);
  const monthsAfter = Math.min(Math.max(Number(state.selectedFamilyBudgetMonthsAfter || 0), 0), 12);
  return getMonthRangeAround(referenceMonth, monthsBefore, monthsAfter);
}

function updateFamilyBudgetFilterSummary() {
  const summary = document.getElementById("familyBudgetFilterSummary");
  if (!summary) return;

  const referenceMonth = state.selectedFamilyBudgetReferenceMonth || getCurrentMonth();
  const monthsBefore = Math.min(Math.max(Number(state.selectedFamilyBudgetMonthsBefore || 0), 0), 12);
  const monthsAfter = Math.min(Math.max(Number(state.selectedFamilyBudgetMonthsAfter || 0), 0), 12);

  summary.textContent = `${getMonthLabel(referenceMonth)} · -${monthsBefore} / +${monthsAfter} mesi`;
}

function renderFamilyBudgetRangeSelectors() {
  const beforeSelect = document.getElementById("familyBudgetMonthsBefore");
  const afterSelect = document.getElementById("familyBudgetMonthsAfter");

  if (!beforeSelect || !afterSelect) return;

  const options = Array.from({ length: 13 }, (_, index) => {
    return `<option value="${index}">${index}</option>`;
  }).join("");

  beforeSelect.innerHTML = options;
  afterSelect.innerHTML = options;

  beforeSelect.value = String(Math.min(Math.max(Number(state.selectedFamilyBudgetMonthsBefore || 0), 0), 12));
  afterSelect.value = String(Math.min(Math.max(Number(state.selectedFamilyBudgetMonthsAfter || 0), 0), 12));
}

function getIncomesForMonth(month) {
  return state.incomes.filter(income => income.month === month);
}

function getIncomeTotalForMonth(month) {
  return roundToTwoDecimals(getIncomesForMonth(month).reduce((sum, income) => sum + Number(income.amount || 0), 0));
}

function getIncomeTotalForMonths(months) {
  return roundToTwoDecimals(months.reduce((sum, month) => sum + getIncomeTotalForMonth(month), 0));
}

function resetFamilyIncomeForm() {
  const idInput = document.getElementById("incomeId");
  const monthInput = document.getElementById("incomeMonth");
  const descriptionInput = document.getElementById("incomeDescription");
  const amountInput = document.getElementById("incomeAmount");
  const saveButton = document.getElementById("saveIncomeButton");
  const cancelButton = document.getElementById("cancelIncomeEditButton");

  editingIncomeId = null;

  if (idInput) idInput.value = "";
  if (monthInput) monthInput.value = state.selectedFamilyBudgetReferenceMonth || getCurrentMonth();
  renderMonthPickerButton("incomeMonthButton", monthInput?.value || state.selectedFamilyBudgetReferenceMonth || getCurrentMonth());
  if (descriptionInput) descriptionInput.value = "";
  if (amountInput) amountInput.value = "";
  if (saveButton) saveButton.textContent = "Salva entrata";
  if (cancelButton) cancelButton.classList.add("hidden");
}

function saveFamilyIncome(event) {
  event.preventDefault();

  const idInput = document.getElementById("incomeId");
  const month = document.getElementById("incomeMonth")?.value || getCurrentMonth();
  const description = document.getElementById("incomeDescription")?.value.trim() || "Entrata";
  const amount = Number(document.getElementById("incomeAmount")?.value || 0);
  const id = idInput?.value || "";

  if (!month) {
    alert("Inserisci il mese dell'entrata.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Inserisci un importo entrata maggiore di zero.");
    return;
  }

  if (id) {
    const index = state.incomes.findIndex(income => income.id === id);
    if (index !== -1) {
      state.incomes[index] = {
        ...state.incomes[index],
        month,
        description,
        amount: roundToTwoDecimals(amount)
      };
    }
  } else {
    state.incomes.push({
      id: createId(),
      month,
      description,
      amount: roundToTwoDecimals(amount)
    });
  }

  state.selectedFamilyBudgetReferenceMonth = month;
  saveState();
  resetFamilyIncomeForm();
  renderFamilyBudget();
}

function startEditIncome(id) {
  const income = state.incomes.find(item => item.id === id);
  if (!income) return;

  editingIncomeId = id;

  const idInput = document.getElementById("incomeId");
  const monthInput = document.getElementById("incomeMonth");
  const descriptionInput = document.getElementById("incomeDescription");
  const amountInput = document.getElementById("incomeAmount");
  const saveButton = document.getElementById("saveIncomeButton");
  const cancelButton = document.getElementById("cancelIncomeEditButton");

  if (idInput) idInput.value = income.id;
  if (monthInput) monthInput.value = income.month;
  renderMonthPickerButton("incomeMonthButton", income.month);
  if (descriptionInput) descriptionInput.value = income.description || "";
  if (amountInput) amountInput.value = Number(income.amount || 0);
  if (saveButton) saveButton.textContent = "Aggiorna entrata";
  if (cancelButton) cancelButton.classList.remove("hidden");
}

function deleteIncome(id) {
  const confirmed = confirm("Vuoi eliminare questa entrata?");
  if (!confirmed) return;

  state.incomes = state.incomes.filter(income => income.id !== id);
  saveState();

  if (editingIncomeId === id) {
    resetFamilyIncomeForm();
  }

  renderFamilyBudget();
}

function renderFamilyIncomeList() {
  const container = document.getElementById("familyIncomeList");
  if (!container) return;

  const months = getFamilyBudgetMonths();
  const visibleIncomes = state.incomes
    .filter(income => months.includes(income.month))
    .sort((a, b) => b.month.localeCompare(a.month) || (a.description || "").localeCompare(b.description || ""));

  if (visibleIncomes.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna entrata nel periodo visualizzato.</p>`;
    return;
  }

  container.innerHTML = visibleIncomes.map(income => `
    <div class="settings-row income-row">
      <div>
        <strong>${escapeHtml(income.description || "Entrata")}</strong><br>
        <span>${getMonthLabel(income.month)}</span>
      </div>
      <div class="income-actions">
        <strong>${formatCurrency(income.amount)}</strong>
        <button class="secondary small" type="button" onclick="startEditIncome('${income.id}')">Modifica</button>
        <button class="danger small" type="button" onclick="deleteIncome('${income.id}')">Elimina</button>
      </div>
    </div>
  `).join("");
}

function renderFamilyBudgetReport() {
  const container = document.getElementById("familyBudgetReport");
  if (!container) return;

  const months = getFamilyBudgetMonths();

  let totalIncome = 0;
  let totalGrossExpenses = 0;
  let totalVoucher = 0;
  let totalReimbursements = 0;
  let totalNetExpenses = 0;

  const categoryTotals = {};
  state.categories.forEach(category => { categoryTotals[category] = 0; });

  const rows = months.map(month => {
    const expenses = getMonthlyExpenses(month);
    const reimbursements = getGenericReimbursementsForMonth(month);

    const grossTotalsByCategory = getTotalsByCategory(expenses);
    const monthGrossExpensesTotal = getTotal(expenses);
    const monthVoucherTotal = getVoucherTotal(expenses);
    const monthReimbursementTotal = getGenericReimbursementTotal(reimbursements);
    const monthNetExpensesTotal = getNetBudgetTotal(expenses, reimbursements);
    const monthIncomeTotal = getIncomeTotalForMonth(month);

    const result = roundToTwoDecimals(monthIncomeTotal - monthGrossExpensesTotal);
    const netResult = roundToTwoDecimals(monthIncomeTotal - monthNetExpensesTotal);

    totalIncome = roundToTwoDecimals(totalIncome + monthIncomeTotal);
    totalGrossExpenses = roundToTwoDecimals(totalGrossExpenses + monthGrossExpensesTotal);
    totalVoucher = roundToTwoDecimals(totalVoucher + monthVoucherTotal);
    totalReimbursements = roundToTwoDecimals(totalReimbursements + monthReimbursementTotal);
    totalNetExpenses = roundToTwoDecimals(totalNetExpenses + monthNetExpensesTotal);

    state.categories.forEach(category => {
      categoryTotals[category] = roundToTwoDecimals((categoryTotals[category] || 0) + Number(grossTotalsByCategory[category] || 0));
    });

    const categoryCells = state.categories.map(category => {
      return `<td>${formatCurrency(grossTotalsByCategory[category] || 0)}</td>`;
    }).join("");

    return `
      <tr>
        <td><strong>${getMonthLabel(month)}</strong></td>
        <td class="${result >= 0 ? "positive-result" : "negative-result"}"><strong>${formatCurrency(result)}</strong></td>
        <td>${formatCurrency(monthVoucherTotal)}</td>
        <td>${formatCurrency(monthReimbursementTotal)}</td>
        <td class="${netResult >= 0 ? "positive-result" : "negative-result"}"><strong>${formatCurrency(netResult)}</strong></td>
        <td>${formatCurrency(monthGrossExpensesTotal)}</td>
        <td>${formatCurrency(monthIncomeTotal)}</td>
        ${categoryCells}
      </tr>
    `;
  }).join("");

  const generalResult = roundToTwoDecimals(totalIncome - totalGrossExpenses);
  const generalNetResult = roundToTwoDecimals(totalIncome - totalNetExpenses);

  const footerCategoryCells = state.categories.map(category => {
    return `<td>${formatCurrency(categoryTotals[category] || 0)}</td>`;
  }).join("");

  container.innerHTML = `
    <div class="multi-table family-budget-table">
      <table>
        <thead>
          <tr>
            <th>Mese</th>
            <th>Saldo lordo</th>
            <th>Voucher</th>
            <th>Rimborsi</th>
            <th>Saldo netto</th>
            <th>Totale spese</th>
            <th>Entrate</th>
            ${state.categories.map(category => `<th>${escapeHtml(category)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <th>Totale periodo</th>
            <th class="${generalResult >= 0 ? "positive-result" : "negative-result"}">${formatCurrency(generalResult)}</th>
            <th>${formatCurrency(totalVoucher)}</th>
            <th>${formatCurrency(totalReimbursements)}</th>
            <th class="${generalNetResult >= 0 ? "positive-result" : "negative-result"}">${formatCurrency(generalNetResult)}</th>
            <th>${formatCurrency(totalGrossExpenses)}</th>
            <th>${formatCurrency(totalIncome)}</th>
            ${footerCategoryCells}
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function renderFamilyBudget() {
  const referenceInput = document.getElementById("familyBudgetReferenceMonth");
  if (!state.selectedFamilyBudgetReferenceMonth) {
    state.selectedFamilyBudgetReferenceMonth = getCurrentMonth();
  }

  if (referenceInput) {
    referenceInput.value = state.selectedFamilyBudgetReferenceMonth;
  }
  renderMonthPickerButton("familyBudgetReferenceMonthButton", state.selectedFamilyBudgetReferenceMonth);

  renderFamilyBudgetRangeSelectors();
  updateFamilyBudgetFilterSummary();

  const incomeMonth = document.getElementById("incomeMonth");
  if (incomeMonth && !incomeMonth.value) {
    incomeMonth.value = state.selectedFamilyBudgetReferenceMonth;
  }
  renderMonthPickerButton("incomeMonthButton", incomeMonth?.value || state.selectedFamilyBudgetReferenceMonth);

  renderFamilyIncomeList();
  renderFamilyBudgetReport();
}

function renderAll() {
  sortCategoriesByOrder();
  renderCategoryOptions();
  renderDashboard();
  renderExpensesList();
  renderReport();
  renderFamilyBudget();
  renderThresholdForm();
  renderCategoriesList();
  renderBackupStatus();
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

  if (isGeneric) {
    hidePaymentSplitMode();
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

function applyCategoryDefaultSplit(options = {}) {
  const categorySelect = document.getElementById("category");
  const isGeneric = document.getElementById("isGenericReimbursement")?.checked || false;
  const isMultiMonth = document.getElementById("isMultiMonth");
  const numberOfMonths = document.getElementById("numberOfMonths");
  const multiMonthOptions = document.getElementById("multiMonthOptions");
  const hint = document.getElementById("categorySplitHint");

  if (!categorySelect || !isMultiMonth || !numberOfMonths || !multiMonthOptions) return;

  const settings = getCategorySettings(categorySelect.value);

  if (isGeneric || settings.splitMode === "none") {
    if (options.forceDefault) {
      isMultiMonth.checked = false;
      multiMonthOptions.classList.add("hidden");
    }
    if (hint) hint.textContent = "";
    return;
  }

  isMultiMonth.checked = true;
  multiMonthOptions.classList.remove("hidden");

  if (settings.splitMode === "calendar-year") {
    numberOfMonths.value = "12";
    if (hint) {
      hint.textContent = "Questa categoria è configurata per ripartire la spesa su tutto l'anno solare.";
    }
    return;
  }

  numberOfMonths.value = String(settings.months || 2);
  if (hint) {
    hint.textContent = `Questa categoria è configurata per ripartire la spesa su ${settings.months || 2} mesi.`;
  }
}

function resetAddExpenseForm(form) {
  form.reset();
  resetReimbursementSourceMode();
  setDefaultDate();
  updateGenericReimbursementMode();
  resetPaymentSplitRows();

  const multiMonthOptions = document.getElementById("multiMonthOptions");
  if (multiMonthOptions) {
    multiMonthOptions.classList.add("hidden");
  }

  applyCategoryDefaultSplit({ forceDefault: true });
}

async function handleExpenseSaved(form) {
  resetAddExpenseForm(form);
  renderAll();

  const addAnother = await appConfirm("Spesa salvata. Vuoi inserire una nuova spesa?", "Spesa salvata");

  if (addAnother) {
    showView("addView");
    const amountInput = document.getElementById("amount");
    if (amountInput) amountInput.focus();
  } else {
    showView("dashboardView");
  }
}


function addExpense(event) {
  event.preventDefault();

  const totalAmount = Number(document.getElementById("amount").value);
  const isGenericReimbursement = document.getElementById("isGenericReimbursement")?.checked || false;
  const date = document.getElementById("date").value;
  const isMultiMonth = !isGenericReimbursement && document.getElementById("isMultiMonth").checked;
  const numberOfMonths = Number(document.getElementById("numberOfMonths").value || 1);
  const category = document.getElementById("category").value;
  const categorySettings = getCategorySettings(category);
  const splitMode = isMultiMonth ? categorySettings.splitMode : "none";
  const description = document.getElementById("description").value.trim();
  const createdAt = new Date().toISOString();

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    alert(isGenericReimbursement ? "Inserisci un importo rimborso maggiore di zero." : "Inserisci un importo spesa maggiore di zero.");
    return;
  }

  if (!date) {
    alert("Inserisci una data valida.");
    return;
  }

  const paymentBreakdown = isGenericReimbursement ? [] : collectPaymentBreakdownFromForm(totalAmount);
  if (!isGenericReimbursement && !paymentBreakdown) {
    return;
  }

  if (isGenericReimbursement) {
    state.reimbursements.push({
      id: createId(),
      amount: roundToTwoDecimals(totalAmount),
      createdAt,
      category,
      date,
      month: getMonthFromDate(date),
      description: description || "Rimborso generico",
      sourceExpenseId: reimbursementSourceExpenseId || null
    });

    saveState();
    handleExpenseSaved(event.target);
    return;
  }

  if (!isMultiMonth) {
    state.expenses.push({
      id: createId(),
      amount: roundToTwoDecimals(totalAmount),
      createdAt,
      category,
      date,
      month: getMonthFromDate(date),
      paymentMethod: getPaymentMethodLabel(paymentBreakdown),
      paymentBreakdown,
      description,
      type: "single"
    });
  } else {
    const effectiveNumberOfMonths = splitMode === "calendar-year" ? 12 : numberOfMonths;

    if (effectiveNumberOfMonths < 2) {
      alert("Per una spesa plurimensile indica almeno 2 mesi.");
      return;
    }

    const groupId = createId();
    const baseAmount = Math.floor((totalAmount / effectiveNumberOfMonths) * 100) / 100;
    const amounts = Array(effectiveNumberOfMonths).fill(baseAmount);
    const remainder = roundToTwoDecimals(totalAmount - baseAmount * effectiveNumberOfMonths);
    amounts[effectiveNumberOfMonths - 1] = roundToTwoDecimals(amounts[effectiveNumberOfMonths - 1] + remainder);

    for (let i = 0; i < effectiveNumberOfMonths; i++) {
      const installmentTarget = splitMode === "calendar-year"
        ? {
          monthKey: `${date.slice(0, 4)}-${String(i + 1).padStart(2, "0")}`
        }
        : getTargetYearMonth(date, i);
      const installmentDate = splitMode === "calendar-year"
        ? `${installmentTarget.monthKey}-01`
        : getInstallmentDate(date, i);

      state.expenses.push({
        id: createId(),
        groupId,
        amount: amounts[i],
        createdAt,
        originalAmount: totalAmount,
        originalDate: date,
        paidDate: date,
        splitMode,
        category,
        date: installmentDate,
        month: installmentTarget.monthKey,
        paymentMethod: getPaymentMethodLabel(splitPaymentBreakdownForInstallment(paymentBreakdown, amounts[i], totalAmount)),
        paymentBreakdown: splitPaymentBreakdownForInstallment(paymentBreakdown, amounts[i], totalAmount),
        description: description || `Spesa plurimensile`,
        type: "multi",
        installmentNumber: i + 1,
        installmentTotal: effectiveNumberOfMonths
      });
    }
  }

  saveState();

  handleExpenseSaved(event.target);
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
          <span>Applica categoria, descrizione e metodi di pagamento a tutte le quote</span>
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

      <div class="payment-split-box">
        <div class="section-title compact-title">
          <strong>Metodi di pagamento</strong>
          <button class="secondary small" type="button" onclick="addEditPaymentSplitRow('${expense.id}')">+ Aggiungi metodo</button>
        </div>
        <div id="editPaymentSplitRows-${expense.id}" class="payment-split-rows">
          ${getPaymentBreakdown(expense).map(row => renderEditPaymentSplitRow(expense.id, row, false)).join("")}
        </div>
        ${isMulti ? `<p class="hint">Puoi modificare i metodi della singola quota oppure applicarli a tutte le quote collegate usando l'opzione sotto.</p>` : ""}
      </div>

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
  renderAll();
}

function cancelEditExpense() {
  editingExpenseId = null;
  renderAll();
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
  const description = document.getElementById(`editDescription-${id}`).value.trim();
  const editPaymentBreakdown = getEditPaymentBreakdownRows(id);
  const editPaymentTotal = roundToTwoDecimals(editPaymentBreakdown.reduce((sum, row) => sum + Number(row.amount || 0), 0));

  const isMulti = existingExpense.type === "multi" && existingExpense.groupId;
  const applyTextToAll = isMulti && document.getElementById(`editApplyText-${id}`)?.checked;
  const redistributeAmount = isMulti && document.getElementById(`editRedistributeAmount-${id}`)?.checked;

  if ((!isMulti || applyTextToAll) && editPaymentBreakdown.length === 0) {
    alert("Inserisci almeno un metodo di pagamento.");
    return;
  }

  if ((!isMulti || !applyTextToAll) && Math.abs(editPaymentTotal - roundToTwoDecimals(amount)) >= 0.01) {
    alert(`La somma dei metodi di pagamento è ${formatCurrency(editPaymentTotal)}, ma l'importo della spesa è ${formatCurrency(amount)}.`);
    return;
  }

  if (isMulti && applyTextToAll) {
    const totalForPayments = Number(document.getElementById(`editOriginalAmount-${id}`)?.value || getMultiTotalAmount(existingExpense));
    const expectedTotal = roundToTwoDecimals(totalForPayments);
    if (Math.abs(editPaymentTotal - expectedTotal) >= 0.01) {
      alert(`Per applicare i metodi a tutte le quote, la somma dei metodi deve essere ${formatCurrency(expectedTotal)}.`);
      return;
    }
  }

  if (!isMulti) {
    state.expenses[expenseIndex] = {
      ...existingExpense,
      amount: roundToTwoDecimals(amount),
      category,
      date,
      month: getMonthFromDate(date),
      paymentMethod: getPaymentMethodLabel(editPaymentBreakdown),
      paymentBreakdown: normalizePaymentBreakdown(editPaymentBreakdown, amount),
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
          paymentMethod: getPaymentMethodLabel(splitPaymentBreakdownForInstallment(editPaymentBreakdown, expense.amount, getMultiTotalAmount(existingExpense))),
          paymentBreakdown: splitPaymentBreakdownForInstallment(editPaymentBreakdown, expense.amount, getMultiTotalAmount(existingExpense)),
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
          paymentBreakdown: splitPaymentBreakdownForInstallment(applyTextToAll ? editPaymentBreakdown : getPaymentBreakdown(expense), amountById.get(expense.id), totalAmount),
          paymentMethod: getPaymentMethodLabel(splitPaymentBreakdownForInstallment(applyTextToAll ? editPaymentBreakdown : getPaymentBreakdown(expense), amountById.get(expense.id), totalAmount)),
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
        paymentMethod: applyTextToAll ? state.expenses[updatedIndex].paymentMethod : getPaymentMethodLabel(normalizePaymentBreakdown(editPaymentBreakdown, amount)),
        paymentBreakdown: applyTextToAll ? state.expenses[updatedIndex].paymentBreakdown : normalizePaymentBreakdown(editPaymentBreakdown, amount),
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
  if (!state.categorySettings) state.categorySettings = {};
  const maxOrder = state.categories.reduce((highest, category) => {
    return Math.max(highest, Number(state.categorySettings?.[category]?.order || 0));
  }, 0);
  state.categorySettings[name] = normalizeCategorySettings({
    ...getDefaultCategorySettings(name),
    order: maxOrder + 10
  }, name);
  sortCategoriesByOrder();
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

  if (!state.categorySettings) state.categorySettings = {};
  state.thresholds.categoryLimits[newName] = state.thresholds.categoryLimits[oldName] || 0;
  state.categorySettings[newName] = state.categorySettings[oldName] || getDefaultCategorySettings(newName);

  if (newName !== oldName) {
    delete state.thresholds.categoryLimits[oldName];
    delete state.categorySettings[oldName];
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
  if (!state.categorySettings) state.categorySettings = {};
  delete state.categorySettings[categoryName];
  syncTotalLimitWithCategories();

  saveState();
  renderAll();
}

function showView(viewId, options = {}) {
  if (viewId === "dashboardView") {
    state.selectedMonth = getCurrentMonth();
  }

  if (viewId === "addView") {
    setDefaultDate();
    applyCategoryDefaultSplit({ forceDefault: true });
  }

  if (viewId === "expensesView" && !options.preserveExpenseFilters) {
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

  if (viewId === "familyBudgetView") {
    renderFamilyBudget();
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
    "Budget",
    "Voucher",
    "Metodi pagamento",
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
    getBudgetRelevantAmount(expense),
    getVoucherAmount(expense),
    getPaymentBreakdown(expense).map(row => `${row.method} ${formatCurrency(row.amount)}`).join(" | "),
    getBudgetRelevantAmount(expense) > 0 ? "Sì" : "No",
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
    -Math.abs(Number(reimbursement.amount || 0)),
    0,
    "Rimborso generico",
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


function createBackupPayload() {
  return {
    app: "spese-pwa-locale",
    version: 3,
    exportedAt: new Date().toISOString(),
    data: state
  };
}

function getBackupTimestamp(backup) {
  const timestamp = Date.parse(backup?.exportedAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getBackupState(backup) {
  return backup?.data || backup;
}

function isValidBackup(backup) {
  const backupState = getBackupState(backup);
  return Boolean(backupState && Array.isArray(backupState.expenses));
}

function getBackupStatus() {
  const saved = localStorage.getItem(BACKUP_STATUS_KEY);
  if (!saved) {
    return {
      localSavedAt: "",
      driveSavedAt: "",
      driveCheckedAt: "",
      driveError: ""
    };
  }

  try {
    return {
      localSavedAt: "",
      driveSavedAt: "",
      driveCheckedAt: "",
      driveError: "",
      ...JSON.parse(saved)
    };
  } catch {
    return {
      localSavedAt: "",
      driveSavedAt: "",
      driveCheckedAt: "",
      driveError: ""
    };
  }
}

function updateBackupStatus(patch) {
  localStorage.setItem(BACKUP_STATUS_KEY, JSON.stringify({
    ...getBackupStatus(),
    ...patch
  }));
  renderBackupStatus();
}

function formatBackupDate(value) {
  if (!value) return "Mai";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponibile";
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderBackupStatus() {
  const container = document.getElementById("backupStatusPanel");
  if (!container) return;

  const status = getBackupStatus();
  container.innerHTML = `
    <div class="backup-status-row ok">
      <span>Ultimo backup locale</span>
      <strong>${escapeHtml(formatBackupDate(status.localSavedAt))}</strong>
    </div>
    <div class="backup-status-row ${status.driveSavedAt ? "ok" : "warning"}">
      <span>Ultimo backup Google Drive</span>
      <strong>${escapeHtml(formatBackupDate(status.driveSavedAt))}</strong>
    </div>
    <div class="backup-status-row">
      <span>Ultimo controllo Drive</span>
      <strong>${escapeHtml(formatBackupDate(status.driveCheckedAt))}</strong>
    </div>
    ${status.driveError ? `
      <div class="backup-status-row warning">
        <span>Ultimo errore Drive</span>
        <strong>${escapeHtml(status.driveError)}</strong>
      </div>
    ` : ""}
  `;
}

function saveLocalBackupSnapshot(backup) {
  localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(backup));
  updateBackupStatus({ localSavedAt: backup.exportedAt || new Date().toISOString() });
}

function getLocalBackupSnapshot() {
  const saved = localStorage.getItem(LOCAL_BACKUP_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    return isValidBackup(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function downloadBackupJson(backup) {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-spese-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function exportJsonBackup(markDailyBackup = true) {
  if (markDailyBackup) {
    state.lastBackupDate = getTodayDateString();
    saveState();
  }

  const backup = createBackupPayload();
  saveLocalBackupSnapshot(backup);
  downloadBackupJson(backup);
  return backup;
}

function waitForGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      if (window.google && google.accounts && google.accounts.oauth2) {
        resolve();
        return;
      }

      if (Date.now() - startedAt > 8000) {
        reject(new Error("Servizi Google non disponibili. Controlla la connessione e riprova."));
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}

async function getGoogleDriveAccessToken() {
  if (googleDriveAccessToken && Date.now() < googleDriveTokenExpiresAt - 60000) {
    return googleDriveAccessToken;
  }

  await waitForGoogleIdentityServices();

  return new Promise((resolve, reject) => {
    googleDriveTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: response => {
        if (response.error) {
          reject(new Error("Accesso a Google Drive non completato."));
          return;
        }

        googleDriveAccessToken = response.access_token;
        googleDriveTokenExpiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
        resolve(googleDriveAccessToken);
      }
    });

    googleDriveTokenClient.requestAccessToken({
      prompt: googleDriveAccessToken ? "" : "consent"
    });
  });
}

async function googleDriveFetch(url, options = {}) {
  const token = await getGoogleDriveAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Errore Google Drive (${response.status}).`);
  }

  return response;
}

function escapeDriveQueryValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function findGoogleDriveBackupFile() {
  const query = encodeURIComponent(`name='${escapeDriveQueryValue(GOOGLE_DRIVE_BACKUP_FILE_NAME)}' and trashed=false`);
  const fields = encodeURIComponent("files(id,name,modifiedTime)");
  const response = await googleDriveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=${fields}&orderBy=modifiedTime desc&pageSize=1`
  );
  const data = await response.json();
  return Array.isArray(data.files) && data.files.length > 0 ? data.files[0] : null;
}

async function createGoogleDriveBackupFile(json) {
  const metadata = {
    name: GOOGLE_DRIVE_BACKUP_FILE_NAME,
    mimeType: "application/json"
  };
  const boundary = "spese-pwa-backup-boundary";
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    json,
    `--${boundary}--`
  ].join("\r\n");

  await googleDriveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime", {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });
}

async function updateGoogleDriveBackupFile(fileId, json) {
  await googleDriveFetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,modifiedTime`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    },
    body: json
  });
}

async function saveBackupToGoogleDrive(backup) {
  const json = JSON.stringify(backup, null, 2);
  const existingFile = await findGoogleDriveBackupFile();

  if (existingFile) {
    await updateGoogleDriveBackupFile(existingFile.id, json);
  } else {
    await createGoogleDriveBackupFile(json);
  }

  updateBackupStatus({
    driveSavedAt: backup.exportedAt || new Date().toISOString(),
    driveCheckedAt: new Date().toISOString(),
    driveError: ""
  });
}

async function exportJsonBackupToGoogleDrive() {
  try {
    state.lastBackupDate = getTodayDateString();
    saveState();

    const backup = createBackupPayload();
    saveLocalBackupSnapshot(backup);
    await saveBackupToGoogleDrive(backup);

    closeDailyBackupReminder();
    await appAlert("Backup salvato su Google Drive.", "Backup completato");
  } catch (error) {
    const message = error.message || "Non riesco a salvare il backup su Google Drive.";
    updateBackupStatus({
      driveCheckedAt: new Date().toISOString(),
      driveError: message
    });
    await appAlert(message, "Backup Drive non riuscito");
  }
}

async function exportJsonBackupLocalAndDrive({ goHome = false, showSuccess = true } = {}) {
  const backup = exportJsonBackup(true);
  let driveSaved = false;
  let driveError = "";

  try {
    await saveBackupToGoogleDrive(backup);
    driveSaved = true;
  } catch (error) {
    driveError = error.message || "Non riesco a salvare il backup su Google Drive.";
    updateBackupStatus({
      driveCheckedAt: new Date().toISOString(),
      driveError
    });
  }

  closeDailyBackupReminder();

  if (goHome) {
    showView("dashboardView");
  }

  if (driveSaved && showSuccess) {
    await appAlert("Backup JSON locale creato e backup salvato su Google Drive.", "Backup completato");
  }

  if (!driveSaved) {
    await appAlert(`Backup JSON locale creato.\nBackup Google Drive non riuscito: ${driveError}`, "Backup parziale");
  }
}

async function getGoogleDriveBackupSnapshot() {
  const existingFile = await findGoogleDriveBackupFile();
  if (!existingFile) return null;

  const response = await googleDriveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(existingFile.id)}?alt=media`);
  const parsed = await response.json();
  updateBackupStatus({
    driveCheckedAt: new Date().toISOString(),
    driveError: ""
  });
  return isValidBackup(parsed) ? parsed : null;
}

function restoreBackup(backup) {
  state = migrateState(getBackupState(backup));
  saveState();
  saveLocalBackupSnapshot(backup);
  renderAll();
  showView("dashboardView");
}

function getBackupSourceLabel(source) {
  return source === "drive" ? "Google Drive" : "locale";
}

async function importJsonBackupFromGoogleDrive() {
  try {
    const localBackup = getLocalBackupSnapshot();
    let driveBackup = null;
    let driveError = "";

    try {
      driveBackup = await getGoogleDriveBackupSnapshot();
    } catch (error) {
      driveError = error.message || "Non riesco a leggere il backup su Google Drive.";
    }

    const candidates = [
      localBackup ? { source: "locale", backup: localBackup } : null,
      driveBackup ? { source: "drive", backup: driveBackup } : null
    ].filter(Boolean);

    if (candidates.length === 0) {
      await appAlert(driveError || "Non ho trovato backup locali o su Google Drive.", "Nessun backup trovato");
      return;
    }

    const newest = candidates.sort((a, b) => getBackupTimestamp(b.backup) - getBackupTimestamp(a.backup))[0];
    const dateLabel = newest.backup.exportedAt
      ? new Date(newest.backup.exportedAt).toLocaleString("it-IT")
      : "data non disponibile";

    const confirmed = await appConfirm(`Vuoi ripristinare il backup più recente (${getBackupSourceLabel(newest.source)}, ${dateLabel})?\nI dati attuali verranno sostituiti.`, "Ripristino backup");
    if (!confirmed) return;

    restoreBackup(newest.backup);
    await appAlert(`Backup ripristinato dalla copia ${getBackupSourceLabel(newest.source)}.${driveError ? `\nNota: ${driveError}` : ""}`, "Ripristino completato");
  } catch (error) {
    await appAlert(error.message || "Non riesco a ripristinare il backup.", "Ripristino non riuscito");
  }
}

async function verifyGoogleDriveBackup() {
  try {
    const backup = await getGoogleDriveBackupSnapshot();
    updateBackupStatus({
      driveCheckedAt: new Date().toISOString(),
      driveError: ""
    });

    if (backup) {
      await appAlert(`Connessione Google Drive riuscita.\nBackup trovato: ${formatBackupDate(backup.exportedAt)}`, "Google Drive OK");
    } else {
      await appAlert("Connessione Google Drive riuscita, ma non ho trovato un backup salvato.", "Google Drive OK");
    }
  } catch (error) {
    const message = error.message || "Non riesco a verificare Google Drive.";
    updateBackupStatus({
      driveCheckedAt: new Date().toISOString(),
      driveError: message
    });
    await appAlert(message, "Verifica Drive non riuscita");
  }
}

function shouldShowDailyBackupReminder() {
  return state.lastBackupDate !== getTodayDateString();
}

function showDailyBackupReminderIfNeeded() {
  const modal = document.getElementById("dailyBackupModal");
  if (!modal) return;

  if (shouldShowDailyBackupReminder()) {
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

function closeDailyBackupReminder() {
  const modal = document.getElementById("dailyBackupModal");
  if (modal) modal.classList.add("hidden");
}

async function exportDailyBackupAndGoHome() {
  await exportJsonBackupLocalAndDrive({ goHome: true, showSuccess: false });
}

function importJsonBackup(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    (async () => {
      try {
      const parsed = JSON.parse(reader.result);

      if (!isValidBackup(parsed)) {
        await appAlert("Il file selezionato non sembra essere un backup valido.", "Backup non valido");
        event.target.value = "";
        return;
      }

      saveLocalBackupSnapshot(parsed);

      let driveBackup = null;
      let driveError = "";

      try {
        driveBackup = await getGoogleDriveBackupSnapshot();
      } catch (error) {
        driveError = error.message || "Non riesco a leggere il backup su Google Drive.";
      }

      const candidates = [
        { source: "locale", backup: parsed },
        driveBackup ? { source: "drive", backup: driveBackup } : null
      ].filter(Boolean);
      const newest = candidates.sort((a, b) => getBackupTimestamp(b.backup) - getBackupTimestamp(a.backup))[0];
      const dateLabel = newest.backup.exportedAt
        ? new Date(newest.backup.exportedAt).toLocaleString("it-IT")
        : "data non disponibile";

      const confirmed = await appConfirm(
        `Vuoi ripristinare il backup più recente (${getBackupSourceLabel(newest.source)}, ${dateLabel})?\nI dati attuali verranno sostituiti.`,
        "Ripristino backup"
      );

      if (!confirmed) {
        event.target.value = "";
        return;
      }

      restoreBackup(newest.backup);
      event.target.value = "";
      await appAlert(`Backup ripristinato dalla copia ${getBackupSourceLabel(newest.source)}.${driveError ? `\nNota: ${driveError}` : ""}`, "Ripristino completato");
    } catch (error) {
      await appAlert(error.message || "Non riesco a leggere il file JSON selezionato.", "Ripristino non riuscito");
      event.target.value = "";
    }
    })();
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
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("service-worker.js").then(registration => {
    registration.update();

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  });
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

const addPaymentMethodButton = document.getElementById("addPaymentMethodButton");
if (addPaymentMethodButton) {
  addPaymentMethodButton.addEventListener("click", showPaymentSplitModeFromSingle);
}

const addPaymentSplitRowButton = document.getElementById("addPaymentSplitRowButton");
if (addPaymentSplitRowButton) {
  addPaymentSplitRowButton.addEventListener("click", addPaymentSplitRow);
}

const amountInputForPaymentSplit = document.getElementById("amount");
if (amountInputForPaymentSplit) {
  amountInputForPaymentSplit.addEventListener("change", () => {
    if (!isPaymentSplitModeActive()) return;

    syncPaymentSplitRowsFromDom();
    if (paymentSplitRows.length === 1 && !paymentSplitRows[0].amount) {
      paymentSplitRows[0].amount = amountInputForPaymentSplit.value;
      renderPaymentSplitRows();
    }
  });
}

const expenseCategorySelect = document.getElementById("category");
if (expenseCategorySelect) {
  expenseCategorySelect.addEventListener("change", () => applyCategoryDefaultSplit({ forceDefault: true }));
}


const thresholdForm = document.getElementById("thresholdForm");
if (thresholdForm) {
  thresholdForm.addEventListener("submit", saveThresholds);
}
document.getElementById("categoryForm").addEventListener("submit", addCategory);
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);
document.getElementById("resetDataButton").addEventListener("click", resetData);
document.getElementById("exportJsonButton").addEventListener("click", () => exportJsonBackupLocalAndDrive());
document.getElementById("importJsonInput").addEventListener("change", importJsonBackup);

const exportDriveButton = document.getElementById("exportDriveButton");
if (exportDriveButton) {
  exportDriveButton.addEventListener("click", exportJsonBackupToGoogleDrive);
}

const importDriveButton = document.getElementById("importDriveButton");
if (importDriveButton) {
  importDriveButton.addEventListener("click", importJsonBackupFromGoogleDrive);
}

const verifyDriveButton = document.getElementById("verifyDriveButton");
if (verifyDriveButton) {
  verifyDriveButton.addEventListener("click", verifyGoogleDriveBackup);
}

const dailyBackupExportButton = document.getElementById("dailyBackupExportButton");
if (dailyBackupExportButton) {
  dailyBackupExportButton.addEventListener("click", exportDailyBackupAndGoHome);
}

const dailyBackupLaterButton = document.getElementById("dailyBackupLaterButton");
if (dailyBackupLaterButton) {
  dailyBackupLaterButton.addEventListener("click", closeDailyBackupReminder);
}
const homeMonthSelect = document.getElementById("homeMonthSelect");
if (homeMonthSelect) {
  homeMonthSelect.addEventListener("change", event => {
    state.selectedMonth = event.target.value;
    saveState();
    renderDashboard();
  });
}
const homeMonthPickerButton = document.getElementById("homeMonthPickerButton");
if (homeMonthPickerButton) {
  homeMonthPickerButton.addEventListener("click", () => {
    showMonthPicker({
      title: "Mese da visualizzare",
      selectedMonth: state.selectedMonth || getCurrentMonth(),
      onSelect: month => {
        state.selectedMonth = month;
        saveState();
        renderDashboard();
      }
    });
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
const multiReportReferenceMonthButton = document.getElementById("multiReportReferenceMonthButton");
if (multiReportReferenceMonthButton) {
  multiReportReferenceMonthButton.addEventListener("click", () => {
    showMonthPicker({
      title: "Mese di riferimento",
      selectedMonth: state.selectedMultiReportReferenceMonth || getCurrentMonth(),
      onSelect: month => {
        state.selectedMultiReportReferenceMonth = month;
        saveState();
        renderMultiReport();
      }
    });
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
const expensesMonthPickerButton = document.getElementById("expensesMonthPickerButton");
if (expensesMonthPickerButton) {
  expensesMonthPickerButton.addEventListener("click", () => {
    showMonthPicker({
      title: "Selezione rapida mese",
      selectedMonth: state.selectedExpensesMonth || getCurrentMonth(),
      onSelect: month => {
        syncExpensesDateRangeWithMonth(month);
        saveState();
        renderExpensesList();
      }
    });
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



const familyIncomeForm = document.getElementById("familyIncomeForm");
if (familyIncomeForm) {
  familyIncomeForm.addEventListener("submit", saveFamilyIncome);
}

const cancelIncomeEditButton = document.getElementById("cancelIncomeEditButton");
if (cancelIncomeEditButton) {
  cancelIncomeEditButton.addEventListener("click", resetFamilyIncomeForm);
}

const familyBudgetReferenceMonth = document.getElementById("familyBudgetReferenceMonth");
if (familyBudgetReferenceMonth) {
  familyBudgetReferenceMonth.addEventListener("change", event => {
    state.selectedFamilyBudgetReferenceMonth = event.target.value || getCurrentMonth();
    saveState();
    resetFamilyIncomeForm();
    renderFamilyBudget();
  });
}
const familyBudgetReferenceMonthButton = document.getElementById("familyBudgetReferenceMonthButton");
if (familyBudgetReferenceMonthButton) {
  familyBudgetReferenceMonthButton.addEventListener("click", () => {
    showMonthPicker({
      title: "Mese di riferimento",
      selectedMonth: state.selectedFamilyBudgetReferenceMonth || getCurrentMonth(),
      onSelect: month => {
        state.selectedFamilyBudgetReferenceMonth = month;
        saveState();
        resetFamilyIncomeForm();
        renderFamilyBudget();
      }
    });
  });
}

const familyBudgetMonthsBefore = document.getElementById("familyBudgetMonthsBefore");
if (familyBudgetMonthsBefore) {
  familyBudgetMonthsBefore.addEventListener("change", event => {
    state.selectedFamilyBudgetMonthsBefore = Number(event.target.value || 0);
    saveState();
    renderFamilyBudget();
  });
}

const familyBudgetMonthsAfter = document.getElementById("familyBudgetMonthsAfter");
if (familyBudgetMonthsAfter) {
  familyBudgetMonthsAfter.addEventListener("change", event => {
    state.selectedFamilyBudgetMonthsAfter = Number(event.target.value || 0);
    saveState();
    renderFamilyBudget();
  });
}

const familyBudgetCurrentButton = document.getElementById("familyBudgetCurrentButton");
if (familyBudgetCurrentButton) {
  familyBudgetCurrentButton.addEventListener("click", () => {
    state.selectedFamilyBudgetReferenceMonth = getCurrentMonth();
    state.selectedFamilyBudgetMonthsBefore = 0;
    state.selectedFamilyBudgetMonthsAfter = 0;
    saveState();
    resetFamilyIncomeForm();
    renderFamilyBudget();
  });
}

document.getElementById("reportMonthSelect").addEventListener("change", event => {
  state.selectedReportMonth = event.target.value;
  saveState();
  renderReport();
});
const reportMonthPickerButton = document.getElementById("reportMonthPickerButton");
if (reportMonthPickerButton) {
  reportMonthPickerButton.addEventListener("click", () => {
    showMonthPicker({
      title: "Mese da visualizzare",
      selectedMonth: state.selectedReportMonth || getCurrentMonth(),
      onSelect: month => {
        state.selectedReportMonth = month;
        saveState();
        renderReport();
      }
    });
  });
}

const incomeMonthButton = document.getElementById("incomeMonthButton");
if (incomeMonthButton) {
  incomeMonthButton.addEventListener("click", () => {
    const input = document.getElementById("incomeMonth");
    showMonthPicker({
      title: "Mese entrata",
      selectedMonth: input?.value || state.selectedFamilyBudgetReferenceMonth || getCurrentMonth(),
      onSelect: month => {
        if (input) input.value = month;
        renderMonthPickerButton("incomeMonthButton", month);
      }
    });
  });
}

const categoryTrendSelect = document.getElementById("categoryTrendSelect");
if (categoryTrendSelect) {
  categoryTrendSelect.addEventListener("change", () => {
    renderCategoryTrendPanel(state.selectedReportMonth || getCurrentMonth());
  });
}

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
  if (event.target.checked) {
    applyCategoryDefaultSplit();
  } else {
    const hint = document.getElementById("categorySplitHint");
    if (hint) hint.textContent = "";
  }
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
  renderFamilyBudget();
  showDailyBackupReminderIfNeeded();
  registerServiceWorker();
} catch (error) {
  console.error("Errore avvio app", error);
  alert("Errore di avvio app: " + error.message);
}
