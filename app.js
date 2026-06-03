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
  selectedExpensesMonth: getCurrentMonth(),
  selectedReportMonth: getCurrentMonth(),
  selectedMultiReportReferenceMonth: getCurrentMonth(),
  selectedMultiReportMonthsBefore: 0,
  selectedMultiReportMonthsAfter: 0,
  categories: [...defaultCategories],
  expenses: [],
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
    selectedExpensesMonth: rawState.selectedExpensesMonth || rawState.selectedMonth || getCurrentMonth(),
    selectedReportMonth: rawState.selectedReportMonth || rawState.selectedMonth || getCurrentMonth(),
    selectedMultiReportReferenceMonth: rawState.selectedMultiReportReferenceMonth || getCurrentMonth(),
    selectedMultiReportMonthsBefore: Number(rawState.selectedMultiReportMonthsBefore || 0),
    selectedMultiReportMonthsAfter: Number(rawState.selectedMultiReportMonthsAfter || 0),
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
  const months = getMonthsWithExpenses();

  if (months.length === 0) {
    state.selectedExpensesMonth = "";
    return;
  }

  if (!state.selectedExpensesMonth || !months.includes(state.selectedExpensesMonth)) {
    state.selectedExpensesMonth = months[0];
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
}

function renderCategoryOptions() {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = state.categories
    .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
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
  const grossTotal = getTotal(expenses);
  const voucherTotal = getVoucherTotal(expenses);
  const total = getBudgetRelevantTotal(expenses);
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
  document.getElementById("monthlyVoucherTotal").textContent = formatCurrency(voucherTotal);

  const progress = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
  document.getElementById("monthlyProgressBar").style.width = `${progress}%`;
  document.getElementById("monthlyStatus").textContent =
    limit > 0
      ? `${Math.round(status.percentage)}% del budget utilizzato — ${status.label}`
      : "Imposta le soglie nella sezione Soglie";

  renderCriticalCategories(expenses);
  renderLatestExpenses(expenses);
}

function renderCriticalCategories(expenses) {
  const container = document.getElementById("criticalCategories");
  const totalsByCategory = getBudgetRelevantTotalsByCategory(expenses);
  const voucherTotalsByCategory = getVoucherTotalsByCategory(expenses);

  const critical = state.categories
    .map(category => {
      const spent = totalsByCategory[category] || 0;
      const voucherSpent = voucherTotalsByCategory[category] || 0;
      const limit = Number(state.thresholds.categoryLimits[category] || 0);
      const status = getThresholdStatus(spent, limit);
      return { category, spent, voucherSpent, limit, status };
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

  const voucherInfo = isVoucherExpense(expense)
    ? `<span class="voucher-note">Voucher: non incide sul budget</span>`
    : "";

  return `
    <div class="expense-row">
      <div class="expense-main">
        <strong>${escapeHtml(expense.category)}</strong>
        <span>${expense.date} · ${escapeHtml(expense.paymentMethod)}</span>
        <span>${escapeHtml(expense.description || "Nessuna descrizione")}</span>
        ${multiInfo}
        ${voucherInfo}
      </div>
      <div>
        <div class="amount">${formatCurrency(expense.amount)}</div>
        ${showDelete ? `<button class="secondary small" onclick="deleteExpense('${expense.id}')">Elimina</button>` : ""}
      </div>
    </div>
  `;
}

function renderExpensesMonthSelect() {
  const select = document.getElementById("expensesMonthSelect");
  const months = getMonthsWithExpenses();

  if (!select) return;

  ensureSelectedExpensesMonth();

  if (months.length === 0) {
    select.innerHTML = `<option value="">Nessuna spesa registrata</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = months
    .map(month => `
      <option value="${month}" ${month === state.selectedExpensesMonth ? "selected" : ""}>
        ${getMonthLabel(month)}
      </option>
    `)
    .join("");
}

function renderExpensesList() {
  renderExpensesMonthSelect();

  const container = document.getElementById("expensesList");
  const selectedExpensesMonth = state.selectedExpensesMonth;

  if (!selectedExpensesMonth) {
    container.innerHTML = `<p class="empty">Non ci sono ancora spese registrate.</p>`;
    return;
  }

  const expenses = getMonthlyExpenses(selectedExpensesMonth)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (expenses.length === 0) {
    container.innerHTML = `<p class="empty">Nessuna spesa presente per il mese selezionato.</p>`;
    return;
  }

  const total = getTotal(expenses);

  const summary = `
    <div class="report-summary">
      <span>Totale ${getMonthLabel(selectedExpensesMonth)}</span>
      <strong>${formatCurrency(total)}</strong>
    </div>
  `;

  container.innerHTML = summary + expenses
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
    renderMultiReport();
    return;
  }

  const expenses = getMonthlyExpenses(selectedReportMonth);
  const totalsByCategory = getBudgetRelevantTotalsByCategory(expenses);
  const grossTotalsByCategory = getTotalsByCategory(expenses);
  const voucherTotalsByCategory = getVoucherTotalsByCategory(expenses);
  const total = getBudgetRelevantTotal(expenses);
  const grossTotal = getTotal(expenses);
  const voucherTotal = getVoucherTotal(expenses);

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
      <span>Totale registrato / Voucher</span>
      <strong>${formatCurrency(grossTotal)} / ${formatCurrency(voucherTotal)}</strong>
    </div>
  `;

  const rows = state.categories
    .filter(category => (totalsByCategory[category] || 0) > 0 || (state.thresholds.categoryLimits[category] || 0) > 0)
    .map(category => {
      const spent = totalsByCategory[category] || 0;
      const grossSpent = grossTotalsByCategory[category] || 0;
      const voucherSpent = voucherTotalsByCategory[category] || 0;
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

function getMultiReportData() {
  const referenceMonth = state.selectedMultiReportReferenceMonth || getCurrentMonth();
  const monthsBefore = Number(state.selectedMultiReportMonthsBefore || 0);
  const monthsAfter = Number(state.selectedMultiReportMonthsAfter || 0);
  const months = getMonthRangeAround(referenceMonth, monthsBefore, monthsAfter);

  return months.map(month => {
    const expenses = getMonthlyExpenses(month);
    const totalsByCategory = getBudgetRelevantTotalsByCategory(expenses);
    const grossTotalsByCategory = getTotalsByCategory(expenses);
    const voucherTotalsByCategory = getVoucherTotalsByCategory(expenses);
    const total = getBudgetRelevantTotal(expenses);
    const grossTotal = getTotal(expenses);
    const voucherTotal = getVoucherTotal(expenses);
    return { month, total, grossTotal, voucherTotal, totalsByCategory, grossTotalsByCategory, voucherTotalsByCategory };
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

  const maxStack = Math.max(
    ...data.map(item => state.categories.reduce((sum, category) => sum + Number(item.totalsByCategory[category] || 0), 0)),
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

    state.categories.forEach((category, categoryIndex) => {
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

  const categoryItems = state.categories.map((category, index) => `
    <span class="legend-item">
      <span class="legend-color" style="background:${getCategoryColor(index)}"></span>
      ${escapeHtml(category)}
    </span>
  `).join("");

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

  const rows = data.map(item => {
    const categoryCells = state.categories.map(category => {
      return `<td>${formatCurrency(item.totalsByCategory[category] || 0)}</td>`;
    }).join("");

    return `
      <tr>
        <td>${getMonthLabel(item.month)}</td>
        ${categoryCells}
        <td><strong>${formatCurrency(item.total)}</strong></td>
        <td>${formatCurrency(item.grossTotal || 0)}</td>
        <td>${formatCurrency(item.voucherTotal || 0)}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="multi-table">
      <table>
        <thead>
          <tr>
            <th>Mese</th>
            ${state.categories.map(category => `<th>${escapeHtml(category)} budget</th>`).join("")}
            <th>Totale budget</th>
            <th>Totale registrato</th>
            <th>Voucher</th>
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

  if (viewId === "reportView") {
    renderReport();
    renderMultiReport();
  }
}


function exportCsv() {
  const selectedExpensesMonth = state.selectedExpensesMonth;
  const expenses = selectedExpensesMonth ? getMonthlyExpenses(selectedExpensesMonth) : [];

  if (expenses.length === 0) {
    alert("Non ci sono spese da esportare per il mese selezionato.");
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

  const csv = [header, ...rows]
    .map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `spese-${state.selectedExpensesMonth}.csv`;
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
document.getElementById("expensesMonthSelect").addEventListener("change", event => {
  state.selectedExpensesMonth = event.target.value;
  saveState();
  renderExpensesList();
});
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

document.getElementById("appVersion").textContent = APP_VERSION;
syncTotalLimitWithCategories();
state.selectedMonth = getCurrentMonth();
setDefaultDate();
renderAll();
renderMultiReport();
registerServiceWorker();
