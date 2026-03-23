const STORAGE_KEY = "meditrack.products.v1";
const USERS = [
  { username: "admin", password: "Admin@123", role: "admin", display: "Admin" },
  { username: "pharmacist", password: "Pharma@123", role: "pharmacist", display: "Pharmacist" }
];

const state = {
  currentUser: null,
  products: [],
  editId: null,
  filter: "all",
  query: "",
  nearDays: 30
};

const ui = {
  authSection: document.getElementById("authSection"),
  dashboardSection: document.getElementById("dashboardSection"),
  adminLoginForm: document.getElementById("adminLoginForm"),
  pharmaLoginForm: document.getElementById("pharmaLoginForm"),
  welcomeTitle: document.getElementById("welcomeTitle"),
  welcomeSub: document.getElementById("welcomeSub"),
  nearExpiryDays: document.getElementById("nearExpiryDays"),
  logoutBtn: document.getElementById("logoutBtn"),
  form: document.getElementById("productForm"),
  formHeading: document.getElementById("formHeading"),
  productId: document.getElementById("productId"),
  productName: document.getElementById("productName"),
  batchNo: document.getElementById("batchNo"),
  category: document.getElementById("category"),
  quantity: document.getElementById("quantity"),
  mfgDate: document.getElementById("mfgDate"),
  expDate: document.getElementById("expDate"),
  resetBtn: document.getElementById("resetBtn"),
  saveBtn: document.getElementById("saveBtn"),
  formError: document.getElementById("formError"),
  inventoryBody: document.getElementById("inventoryBody"),
  statusFilter: document.getElementById("statusFilter"),
  searchInput: document.getElementById("searchInput"),
  emptyState: document.getElementById("emptyState"),
  totalCount: document.getElementById("totalCount"),
  expiredCount: document.getElementById("expiredCount"),
  nearCount: document.getElementById("nearCount"),
  safeCount: document.getElementById("safeCount")
};

init();

function init() {
  loadProducts();
  wireAuthForms();
  wireDashboardEvents();
  render();
}

function wireAuthForms() {
  const handler = (role, form) => (event) => {
    event.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value;
    if (!username || !password) {
      alert("Both username and password are required.");
      return;
    }
    const user = USERS.find((u) => u.role === role && u.username === username && u.password === password);
    if (!user) {
      alert(`Invalid ${role} credentials.`);
      return;
    }
    state.currentUser = user;
    form.reset();
    enterDashboard();
  };

  ui.adminLoginForm.addEventListener("submit", handler("admin", ui.adminLoginForm));
  ui.pharmaLoginForm.addEventListener("submit", handler("pharmacist", ui.pharmaLoginForm));
}

function wireDashboardEvents() {
  ui.logoutBtn.addEventListener("click", () => {
    state.currentUser = null;
    resetForm();
    ui.dashboardSection.classList.add("hidden");
    ui.authSection.classList.remove("hidden");
  });

  ui.form.addEventListener("submit", onSubmitProduct);
  ui.resetBtn.addEventListener("click", resetForm);

  ui.statusFilter.addEventListener("change", (e) => {
    state.filter = e.target.value;
    renderTable();
  });

  ui.searchInput.addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    renderTable();
  });

  ui.nearExpiryDays.addEventListener("change", (e) => {
    const value = Number.parseInt(e.target.value, 10);
    if (Number.isNaN(value) || value < 1 || value > 365) {
      e.target.value = String(state.nearDays);
      return;
    }
    state.nearDays = value;
    render();
  });
}

function enterDashboard() {
  ui.authSection.classList.add("hidden");
  ui.dashboardSection.classList.remove("hidden");
  ui.welcomeTitle.textContent = `Welcome, ${state.currentUser.display}`;
  ui.welcomeSub.textContent = state.currentUser.role === "admin"
    ? "You can create, update and delete products."
    : "You can create and update products. Delete is restricted to admin.";
  const isAdmin = state.currentUser.role === "admin";
  ui.saveBtn.textContent = isAdmin ? "Save Product" : "Save Product";
  render();
}

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.products = raw ? JSON.parse(raw) : seedProducts();
    persist();
  } catch {
    state.products = seedProducts();
    persist();
  }
}

function seedProducts() {
  return [
    {
      id: crypto.randomUUID(),
      name: "Cetirizine 10mg",
      batchNo: "CET-26-01",
      category: "Antihistamine",
      quantity: 120,
      mfgDate: "2025-01-10",
      expDate: "2026-04-15",
      createdBy: "admin"
    },
    {
      id: crypto.randomUUID(),
      name: "Paracetamol 500mg",
      batchNo: "PAR-24-99",
      category: "Analgesic",
      quantity: 60,
      mfgDate: "2024-11-02",
      expDate: "2026-02-15",
      createdBy: "pharmacist"
    }
  ];
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.products));
}

function onSubmitProduct(event) {
  event.preventDefault();
  ui.formError.textContent = "";

  const payload = {
    id: state.editId || crypto.randomUUID(),
    name: ui.productName.value.trim(),
    batchNo: ui.batchNo.value.trim().toUpperCase(),
    category: ui.category.value.trim(),
    quantity: Number.parseInt(ui.quantity.value, 10),
    mfgDate: ui.mfgDate.value,
    expDate: ui.expDate.value,
    createdBy: state.currentUser.username
  };

  const error = validateProduct(payload, state.editId);
  if (error) {
    ui.formError.textContent = error;
    return;
  }

  if (state.editId) {
    state.products = state.products.map((p) => (p.id === state.editId ? payload : p));
  } else {
    state.products.unshift(payload);
  }

  persist();
  resetForm();
  render();
}

function validateProduct(product, editId = null) {
  if (!product.name || !product.batchNo || !product.category || !product.mfgDate || !product.expDate) {
    return "All fields are required.";
  }
  if (product.name.length < 3) return "Product name must be at least 3 characters.";
  if (!/^[A-Z0-9-]+$/i.test(product.batchNo)) return "Batch number can only contain letters, numbers, and hyphens.";
  if (!Number.isInteger(product.quantity) || product.quantity <= 0) return "Quantity must be a positive whole number.";

  const mfg = new Date(product.mfgDate);
  const exp = new Date(product.expDate);
  if (Number.isNaN(mfg.getTime()) || Number.isNaN(exp.getTime())) return "Enter valid manufacturing and expiry dates.";
  if (exp <= mfg) return "Expiry date must be after manufacturing date.";

  const duplicate = state.products.find((p) =>
    p.name.toLowerCase() === product.name.toLowerCase() &&
    p.batchNo.toLowerCase() === product.batchNo.toLowerCase() &&
    p.id !== editId
  );
  if (duplicate) return "A product with this name and batch already exists.";

  return null;
}

function getStatus(expDate) {
  const now = normalizeDate(new Date());
  const exp = normalizeDate(new Date(expDate));
  const diffDays = Math.ceil((exp - now) / 86400000);
  if (diffDays < 0) return "expired";
  if (diffDays <= state.nearDays) return "near";
  return "safe";
}

function normalizeDate(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    const status = getStatus(product.expDate);
    const matchesFilter = state.filter === "all" || status === state.filter;
    const haystack = `${product.name} ${product.batchNo} ${product.category}`.toLowerCase();
    const matchesSearch = !state.query || haystack.includes(state.query);
    return matchesFilter && matchesSearch;
  });
}

function render() {
  renderStats();
  renderTable();
}

function renderStats() {
  const counts = { expired: 0, near: 0, safe: 0 };
  for (const product of state.products) counts[getStatus(product.expDate)] += 1;

  ui.totalCount.textContent = String(state.products.length);
  ui.expiredCount.textContent = String(counts.expired);
  ui.nearCount.textContent = String(counts.near);
  ui.safeCount.textContent = String(counts.safe);
}

function renderTable() {
  const products = getFilteredProducts();
  ui.inventoryBody.innerHTML = "";

  for (const product of products) {
    const status = getStatus(product.expDate);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.batchNo)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${product.quantity}</td>
      <td>${product.mfgDate}</td>
      <td>${product.expDate}</td>
      <td><span class="badge ${status}">${labelForStatus(status)}</span></td>
      <td>
        <div class="action-group">
          <button class="small-btn" data-action="edit" data-id="${product.id}">Edit</button>
          <button class="small-btn btn-danger" data-action="delete" data-id="${product.id}">Delete</button>
        </div>
      </td>
    `;
    ui.inventoryBody.appendChild(row);
  }

  ui.emptyState.classList.toggle("hidden", products.length > 0);

  ui.inventoryBody.querySelectorAll("button[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => onEditProduct(btn.dataset.id));
  });

  ui.inventoryBody.querySelectorAll("button[data-action='delete']").forEach((btn) => {
    const isAdmin = state.currentUser?.role === "admin";
    btn.disabled = !isAdmin;
    btn.title = isAdmin ? "Delete product" : "Only admin can delete products";
    btn.addEventListener("click", () => onDeleteProduct(btn.dataset.id));
  });
}

function onEditProduct(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;

  state.editId = id;
  ui.formHeading.textContent = "Edit Product";
  ui.productName.value = product.name;
  ui.batchNo.value = product.batchNo;
  ui.category.value = product.category;
  ui.quantity.value = String(product.quantity);
  ui.mfgDate.value = product.mfgDate;
  ui.expDate.value = product.expDate;
}

function onDeleteProduct(id) {
  if (state.currentUser?.role !== "admin") {
    alert("Access denied. Only admin can delete products.");
    return;
  }
  const target = state.products.find((p) => p.id === id);
  if (!target) return;

  const ok = confirm(`Delete ${target.name} (${target.batchNo})?`);
  if (!ok) return;

  state.products = state.products.filter((p) => p.id !== id);
  if (state.editId === id) resetForm();
  persist();
  render();
}

function resetForm() {
  state.editId = null;
  ui.form.reset();
  ui.formHeading.textContent = "Add Product";
  ui.formError.textContent = "";
}

function labelForStatus(status) {
  if (status === "expired") return "Expired";
  if (status === "near") return "Near Expiry";
  return "Safe";
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
