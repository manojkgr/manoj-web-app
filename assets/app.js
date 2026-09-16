(() => {
  "use strict";

  // ---------- Column auto-detection ----------
  const COLUMN_HINTS = {
    date: ["date", "txn date", "transaction date", "value date", "posting date"],
    category: ["category", "expense category", "type", "expense type", "head"],
    description: ["description", "narration", "particulars", "merchant", "details", "remarks", "payee"],
    amount: ["amount", "debit", "value", "cost", "spend", "amount (inr)", "amount (rs)", "withdrawal"],
  };

  const CURRENCY_LOCALES = { USD: "en-US", INR: "en-IN", EUR: "en-IE", GBP: "en-GB" };

  function buildCurrencyFormat(code) {
    return new Intl.NumberFormat(CURRENCY_LOCALES[code] || "en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    });
  }

  let CURRENCY_FORMAT = buildCurrencyFormat("USD");

  const AUTO_CATEGORY_VALUE = "__auto__";

  // Bank/card statement exports rarely include a Category column (only a
  // merchant name). When no such column is found, transactions are grouped
  // by matching merchant/description text against these keyword rules,
  // in order, instead of leaving spend uncategorized.
  const MERCHANT_CATEGORY_RULES = [
    { category: "Groceries", keywords: ["grocer", "grocery", "market", "supermarket", "trader joe", "whole food", "wholefds", "stop & shop", "stop and shop", "shoprite", "weis market", "kroger", "safeway", "aldi", "publix", "wegmans", "hannaford", "food lion", "giant food", "vons", "harris teeter", "winn-dixie", "bazar", "bazaar"] },
    { category: "Warehouse Club", keywords: ["costco", "sam's club", "sams club", "bj's wholesale", "bjs wholesale"] },
    { category: "Dining Out", keywords: ["grill", "restaurant", "cafe", "café", "pizza", "bistro", "diner", "kitchen", "eatery", "bbq", "taco", "sushi", "dosa", "spice", "panera", "starbucks", "dunkin", "mcdonald", "burger", "wendy", "chipotle", "subway", "frog yog", "sweet frog", "hut"] },
    { category: "Convenience Store", keywords: ["7-eleven", "7-11", "circle k", "wawa", "quiktrip"] },
    { category: "Pharmacy & Health", keywords: ["cvs", "walgreens", "pharmacy", "rite aid", "doctor", "clinic", "medical"] },
    { category: "Fuel & Transport", keywords: ["fuel", "gas station", " shell ", "exxon", "mobil", " bp ", "chevron", "sunoco", "uber", "lyft"] },
    { category: "Home Improvement", keywords: ["home depot", "lowe's", "lowes", "hdwe", "hardware", "ace hardware"] },
    { category: "Home Services", keywords: ["trugreen", "lawn", "pest control", "plumb", "hvac"] },
    { category: "Travel & Lodging", keywords: ["hotel", "inn ", "motel", "courtyard", "marriott", "hilton", "airport", "airlines", "aramark"] },
    { category: "Alcohol & Liquor", keywords: ["liquor", "wine", "spirits", "bottle king", "beverage"] },
    { category: "Catering & Events", keywords: ["catering", "caterer", "banquet"] },
    { category: "Retail & Shopping", keywords: ["target", "walmart", "amazon", "best buy", "macy", "kohl", "tj maxx", "marshalls"] },
    { category: "Utilities", keywords: ["electric", "utility", "water bill", "internet", "broadband"] },
    { category: "Subscriptions", keywords: ["netflix", "spotify", "prime video", "subscription", "membership"] },
  ];

  function inferCategory(text) {
    const t = ` ${String(text || "").toLowerCase()} `;
    for (const rule of MERCHANT_CATEGORY_RULES) {
      if (rule.keywords.some((kw) => t.includes(kw))) return rule.category;
    }
    return "Other / Uncategorized";
  }

  const SAMPLE_CSV_ROWS = [
    ["Date", "Category", "Description", "Amount"],
    ["2026-06-02", "Rent", "Monthly apartment rent", 32000],
    ["2026-06-03", "Groceries", "BigBasket order", 3200],
    ["2026-06-05", "Dining Out", "Weekend dinner - The Grill House", 2400],
    ["2026-06-06", "Transport", "Uber rides", 850],
    ["2026-06-08", "Shopping", "Amazon - clothes", 4500],
    ["2026-06-09", "Utilities", "Electricity bill", 2100],
    ["2026-06-10", "Subscriptions", "Netflix + Spotify + Prime", 1450],
    ["2026-06-11", "Dining Out", "Team lunch", 1800],
    ["2026-06-12", "Groceries", "Local supermarket", 2600],
    ["2026-06-14", "Entertainment", "Movie tickets", 1200],
    ["2026-06-15", "Rent", "Parking add-on", 1500],
    ["2026-06-16", "Shopping", "Electronics - headphones", 6500],
    ["2026-06-18", "Transport", "Fuel", 3200],
    ["2026-06-19", "Healthcare", "Pharmacy", 950],
    ["2026-06-20", "Dining Out", "Cafe outings", 1600],
    ["2026-06-22", "Travel", "Weekend trip - hotel", 8500],
    ["2026-06-22", "Travel", "Weekend trip - flights", 11200],
    ["2026-06-24", "Groceries", "BigBasket order", 2900],
    ["2026-06-25", "Utilities", "Internet bill", 1200],
    ["2026-06-27", "Shopping", "Amazon - gadgets", 7800],
    ["2026-06-28", "Dining Out", "Birthday dinner", 3400],
    ["2026-06-29", "Subscriptions", "Gym membership", 2000],
    ["2026-07-01", "Rent", "Monthly apartment rent", 32000],
    ["2026-07-02", "Groceries", "BigBasket order", 3400],
    ["2026-07-04", "Dining Out", "Restaurant", 2200],
    ["2026-07-05", "Transport", "Uber rides", 1100],
    ["2026-07-07", "Shopping", "Amazon - home decor", 5200],
    ["2026-07-08", "Utilities", "Electricity bill", 2300],
    ["2026-07-10", "Entertainment", "Concert tickets", 4200],
    ["2026-07-12", "Dining Out", "Weekend brunch", 1900],
    ["2026-07-13", "Groceries", "Local supermarket", 2700],
    ["2026-07-15", "Shopping", "Electronics - smartwatch", 9800],
    ["2026-07-17", "Transport", "Fuel", 3400],
    ["2026-07-18", "Healthcare", "Doctor visit", 1500],
    ["2026-07-20", "Dining Out", "Cafe outings", 1700],
    ["2026-07-23", "Travel", "Weekend getaway", 6800],
    ["2026-07-25", "Groceries", "BigBasket order", 3100],
    ["2026-07-26", "Utilities", "Internet bill", 1200],
    ["2026-07-28", "Shopping", "Amazon - clothes", 4900],
    ["2026-07-29", "Subscriptions", "Netflix + Spotify + Prime", 1450],
    ["2026-07-30", "Dining Out", "Month-end dinner", 2600],
  ];

  // ---------- State ----------
  let rawRows = [];
  let headers = [];
  let transactions = [];
  let charts = { category: null, doughnut: null, trend: null };

  // ---------- DOM refs ----------
  const el = (id) => document.getElementById(id);
  const fileInput = el("fileInput");
  const loadSampleBtn = el("loadSampleBtn");
  const dropZone = el("dropZone");
  const emptyState = el("emptyState");
  const mappingPanel = el("mappingPanel");
  const dashboard = el("dashboard");
  const mapDate = el("mapDate");
  const mapCategory = el("mapCategory");
  const mapDescription = el("mapDescription");
  const mapAmount = el("mapAmount");
  const confirmMappingBtn = el("confirmMappingBtn");
  const thresholdSlider = el("thresholdSlider");
  const thresholdValue = el("thresholdValue");
  const monthFilter = el("monthFilter");
  const currencySelect = el("currencySelect");
  const resetBtn = el("resetBtn");

  // ---------- File handling ----------
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  loadSampleBtn.addEventListener("click", () => {
    const ws = XLSX.utils.aoa_to_sheet(SAMPLE_CSV_ROWS);
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    ingestRows(rows);
  });

  ["dragenter", "dragover"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-active");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-active");
    })
  );
  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  resetBtn.addEventListener("click", () => {
    transactions = [];
    rawRows = [];
    fileInput.value = "";
    dashboard.classList.add("hidden");
    mappingPanel.classList.add("hidden");
    emptyState.classList.remove("hidden");
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      ingestRows(rows);
    };
    reader.readAsArrayBuffer(file);
  }

  function ingestRows(rows) {
    if (!rows.length) {
      alert("Couldn't find any rows in that file. Please check the file and try again.");
      return;
    }
    rawRows = rows;
    headers = Object.keys(rows[0]);
    populateMappingSelects();
    emptyState.classList.add("hidden");
    dashboard.classList.add("hidden");
    mappingPanel.classList.remove("hidden");
  }

  function guessColumn(kind) {
    const hints = COLUMN_HINTS[kind];
    const lowerHeaders = headers.map((h) => String(h).toLowerCase().trim());
    for (const hint of hints) {
      const idx = lowerHeaders.findIndex((h) => h === hint);
      if (idx !== -1) return headers[idx];
    }
    for (const hint of hints) {
      const idx = lowerHeaders.findIndex((h) => h.includes(hint));
      if (idx !== -1) return headers[idx];
    }
    return "";
  }

  function populateMappingSelects() {
    const selects = [mapDate, mapCategory, mapDescription, mapAmount];
    selects.forEach((sel) => (sel.innerHTML = ""));

    headers.forEach((h) => {
      selects.forEach((sel) => {
        const opt = document.createElement("option");
        opt.value = h;
        opt.textContent = h;
        sel.appendChild(opt);
      });
    });

    const autoOpt = document.createElement("option");
    autoOpt.value = AUTO_CATEGORY_VALUE;
    autoOpt.textContent = "✨ No category column — auto-detect from description";
    mapCategory.insertBefore(autoOpt, mapCategory.firstChild);

    const detectedCategory = guessColumn("category");
    mapDate.value = guessColumn("date") || headers[0];
    mapCategory.value = detectedCategory || AUTO_CATEGORY_VALUE;
    mapDescription.value = guessColumn("description") || headers[0];
    mapAmount.value = guessColumn("amount") || headers[0];
  }

  confirmMappingBtn.addEventListener("click", () => {
    const cols = {
      date: mapDate.value,
      category: mapCategory.value,
      description: mapDescription.value,
      amount: mapAmount.value,
    };
    transactions = buildTransactions(rawRows, cols);
    if (!transactions.length) {
      alert("No valid transactions found. Please check the Amount column has numeric values.");
      return;
    }
    mappingPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
    populateMonthFilter();
    renderDashboard();
  });

  // ---------- Parsing helpers ----------
  function parseAmount(value) {
    if (typeof value === "number") return Math.abs(value);
    if (!value) return NaN;
    let s = String(value).trim();
    if (!s) return NaN;
    const isParenNegative = /^\(.*\)$/.test(s);
    s = s.replace(/[(),₹$,]/g, "").replace(/,/g, "");
    s = s.replace(/[^0-9.\-]/g, "");
    const n = parseFloat(s);
    if (isNaN(n)) return NaN;
    return Math.abs(n);
  }

  function parseDate(value) {
    if (value instanceof Date && !isNaN(value)) return value;
    if (typeof value === "number") {
      const d = XLSX.SSF && XLSX.SSF.parse_date_code ? XLSX.SSF.parse_date_code(value) : null;
      if (d) return new Date(d.y, d.m - 1, d.d);
    }
    const s = String(value).trim();
    if (!s) return null;
    let d = new Date(s);
    if (!isNaN(d)) return d;
    const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (m) {
      let [, a, b, y] = m;
      if (y.length === 2) y = "20" + y;
      d = new Date(`${y}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`);
      if (!isNaN(d)) return d;
    }
    return null;
  }

  function buildTransactions(rows, cols) {
    const out = [];
    for (const row of rows) {
      const amount = parseAmount(row[cols.amount]);
      if (isNaN(amount) || amount <= 0) continue;
      const date = parseDate(row[cols.date]);
      const description = String(row[cols.description] || "").trim();
      const category =
        cols.category === AUTO_CATEGORY_VALUE
          ? inferCategory(description)
          : String(row[cols.category] || "Uncategorized").trim() || "Uncategorized";
      out.push({ date, category, description, amount });
    }
    return out;
  }

  // ---------- Month filter ----------
  function populateMonthFilter() {
    const months = new Set();
    transactions.forEach((t) => {
      if (t.date) months.add(monthKey(t.date));
    });
    const sorted = Array.from(months).sort();
    monthFilter.innerHTML = '<option value="all">All months</option>';
    sorted.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = monthLabel(m);
      monthFilter.appendChild(opt);
    });
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  monthFilter.addEventListener("change", renderDashboard);
  thresholdSlider.addEventListener("input", () => {
    thresholdValue.textContent = `${thresholdSlider.value}%`;
    renderDashboard();
  });
  currencySelect.addEventListener("change", () => {
    CURRENCY_FORMAT = buildCurrencyFormat(currencySelect.value);
    renderDashboard();
  });

  // ---------- Rendering ----------
  function getFilteredTransactions() {
    const month = monthFilter.value;
    if (month === "all") return transactions;
    return transactions.filter((t) => t.date && monthKey(t.date) === month);
  }

  function renderDashboard() {
    const data = getFilteredTransactions();
    const total = data.reduce((s, t) => s + t.amount, 0);
    const threshold = Number(thresholdSlider.value);

    const byCategory = groupByCategory(data);
    const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);

    renderStats(data, total, sortedCategories, threshold);
    renderAlerts(sortedCategories, total, threshold);
    renderCharts(sortedCategories, total, data);
    renderTopTransactions(data);
    renderCategoryTable(sortedCategories, total, threshold);
  }

  // Chart.js is loaded from a CDN; a blocked network, ad-blocker, or
  // firewall can prevent it from loading. Isolate chart rendering so that
  // failure never blanks out the stats, alerts, or tables below it.
  function renderCharts(sortedCategories, total, data) {
    resetChartFallback();
    if (typeof Chart === "undefined") {
      showChartFallback("Charts couldn't load — your browser or network blocked the chart library (cdnjs.cloudflare.com). Totals and tables below are unaffected.");
      return;
    }
    try {
      renderCategoryChart(sortedCategories);
      renderDoughnutChart(sortedCategories, total);
      renderTrendChart(data);
    } catch (err) {
      console.error("Chart rendering failed:", err);
      showChartFallback("Charts failed to render. Totals and tables below are unaffected.");
    }
  }

  function resetChartFallback() {
    ["categoryChart", "categoryDoughnut", "trendChart"].forEach((id) => {
      const canvas = el(id);
      canvas.hidden = false;
      const note = canvas.nextElementSibling;
      if (note && note.classList.contains("chart-fallback")) note.remove();
    });
  }

  function showChartFallback(message) {
    ["categoryChart", "categoryDoughnut", "trendChart"].forEach((id) => {
      const canvas = el(id);
      canvas.hidden = true;
      const note = document.createElement("p");
      note.className = "chart-fallback";
      note.textContent = message;
      canvas.insertAdjacentElement("afterend", note);
    });
  }

  function groupByCategory(data) {
    const map = {};
    data.forEach((t) => {
      if (!map[t.category]) map[t.category] = { total: 0, count: 0, txns: [] };
      map[t.category].total += t.amount;
      map[t.category].count += 1;
      map[t.category].txns.push(t);
    });
    return map;
  }

  function renderStats(data, total, sortedCategories, threshold) {
    el("statTotal").textContent = CURRENCY_FORMAT.format(total);
    el("statCount").textContent = data.length.toLocaleString("en-IN");
    el("statAvg").textContent = CURRENCY_FORMAT.format(data.length ? total / data.length : 0);
    el("statTopCategory").textContent = sortedCategories.length ? sortedCategories[0][0] : "—";
    const flaggedCount = sortedCategories.filter(([, v]) => total > 0 && (v.total / total) * 100 >= threshold).length;
    el("statFlagged").textContent = flaggedCount;
  }

  function renderAlerts(sortedCategories, total, threshold) {
    const container = el("alertsList");
    container.innerHTML = "";
    const flagged = sortedCategories.filter(([, v]) => total > 0 && (v.total / total) * 100 >= threshold);

    if (!flagged.length) {
      container.innerHTML = `<div class="no-alerts">✓ No category currently exceeds ${threshold}% of your total spend. Spending looks balanced.</div>`;
      return;
    }

    flagged.forEach(([category, v]) => {
      const pct = (v.total / total) * 100;
      const item = document.createElement("div");
      item.className = "alert-item";
      item.innerHTML = `
        <span class="alert-name">${escapeHtml(category)}</span>
        <span class="alert-amount">${CURRENCY_FORMAT.format(v.total)}</span>
        <span class="alert-sub">${pct.toFixed(1)}% of total spend across ${v.count} transaction${v.count === 1 ? "" : "s"} — avg ${CURRENCY_FORMAT.format(v.total / v.count)}/txn</span>
        <div class="alert-bar-track"><div class="alert-bar-fill" style="width:${Math.min(pct, 100)}%"></div></div>
      `;
      container.appendChild(item);
    });
  }

  function renderCategoryChart(sortedCategories) {
    const ctx = el("categoryChart").getContext("2d");
    const labels = sortedCategories.map(([c]) => c);
    const values = sortedCategories.map(([, v]) => v.total);
    if (charts.category) charts.category.destroy();
    charts.category = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Spend", data: values, backgroundColor: "#4f46e5", borderRadius: 6 }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  const PALETTE = ["#4f46e5", "#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

  function renderDoughnutChart(sortedCategories, total) {
    const ctx = el("categoryDoughnut").getContext("2d");
    const labels = sortedCategories.map(([c]) => c);
    const values = sortedCategories.map(([, v]) => v.total);
    if (charts.doughnut) charts.doughnut.destroy();
    charts.doughnut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]) }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "right", labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${CURRENCY_FORMAT.format(ctx.parsed)} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  function renderTrendChart(data) {
    const byMonth = {};
    data.forEach((t) => {
      if (!t.date) return;
      const key = monthKey(t.date);
      byMonth[key] = (byMonth[key] || 0) + t.amount;
    });
    const sortedKeys = Object.keys(byMonth).sort();
    const ctx = el("trendChart").getContext("2d");
    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(ctx, {
      type: "line",
      data: {
        labels: sortedKeys.map(monthLabel),
        datasets: [
          {
            label: "Monthly spend",
            data: sortedKeys.map((k) => byMonth[k]),
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79,70,229,0.15)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  function renderTopTransactions(data) {
    const top = [...data].sort((a, b) => b.amount - a.amount).slice(0, 15);
    const tbody = document.querySelector("#topTransactionsTable tbody");
    tbody.innerHTML = top
      .map(
        (t) => `
      <tr>
        <td>${t.date ? t.date.toLocaleDateString("en-IN") : "—"}</td>
        <td>${escapeHtml(t.category)}</td>
        <td>${escapeHtml(t.description) || "—"}</td>
        <td class="num">${CURRENCY_FORMAT.format(t.amount)}</td>
      </tr>`
      )
      .join("");
  }

  const expandedCategories = new Set();

  function renderCategoryTable(sortedCategories, total, threshold) {
    const tbody = document.querySelector("#categoryTable tbody");
    tbody.innerHTML = sortedCategories
      .map(([category, v]) => {
        const pct = total ? (v.total / total) * 100 : 0;
        let badge = `<span class="badge badge-ok">Under control</span>`;
        if (pct >= threshold) badge = `<span class="badge badge-high">Needs control</span>`;
        else if (pct >= threshold * 0.66) badge = `<span class="badge badge-watch">Watch</span>`;
        const isExpanded = expandedCategories.has(category);
        const sortedTxns = [...v.txns].sort((a, b) => b.amount - a.amount);
        const detailRows = sortedTxns
          .map(
            (t) => `
            <tr>
              <td>${t.date ? t.date.toLocaleDateString("en-IN") : "—"}</td>
              <td>${escapeHtml(t.description) || "—"}</td>
              <td class="num">${CURRENCY_FORMAT.format(t.amount)}</td>
            </tr>`
          )
          .join("");
        return `
        <tr class="category-row${isExpanded ? " expanded" : ""}" data-category="${escapeHtml(category)}">
          <td><span class="chevron">▸</span>${escapeHtml(category)}</td>
          <td class="num">${v.count}</td>
          <td class="num">${CURRENCY_FORMAT.format(v.total)}</td>
          <td class="num">${pct.toFixed(1)}%</td>
          <td>${badge}</td>
        </tr>
        <tr class="category-detail-row${isExpanded ? "" : " hidden"}" data-category-detail="${escapeHtml(category)}">
          <td colspan="5">
            <table class="category-detail-table">
              <thead><tr><th>Date</th><th>Description</th><th class="num">Amount</th></tr></thead>
              <tbody>${detailRows}</tbody>
            </table>
          </td>
        </tr>`;
      })
      .join("");
  }

  document.querySelector("#categoryTable tbody").addEventListener("click", (e) => {
    const row = e.target.closest(".category-row");
    if (!row) return;
    const category = row.dataset.category;
    const detailRow = document.querySelector(`[data-category-detail="${CSS.escape(category)}"]`);
    if (!detailRow) return;
    const nowExpanded = detailRow.classList.toggle("hidden") === false;
    row.classList.toggle("expanded", nowExpanded);
    if (nowExpanded) expandedCategories.add(category);
    else expandedCategories.delete(category);
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
})();
