// ---------- THEME TOGGLE (dark / light) ----------
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("findit-theme", next);
});
// ---------- STATE ----------
let items = [];
let selectedType = "All";

// ---------- ELEMENTS ----------
const grid = document.getElementById("itemsGrid");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const chips = document.querySelectorAll(".chip");

const modal = document.getElementById("reportModal");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

// ---------- HELPERS ----------
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ---------- API CALLS ----------
async function loadItems() {
    try {
        const response = await fetch("/api/items");
        if (!response.ok) throw new Error("Server error");
        items = await response.json();
        renderItems();
    } catch (error) {
        noResults.textContent = "Could not load items. Is the server running?";
        noResults.classList.remove("hidden");
    }
}

async function loadStats() {
    try {
        const response = await fetch("/api/items/stats");
        if (!response.ok) throw new Error("Server error");
        const stats = await response.json();
        document.getElementById("statLost").textContent = stats.lost;
        document.getElementById("statFound").textContent = stats.found;
        document.getElementById("statReturned").textContent = stats.returned;
    } catch (error) {
        console.error("Stats load failed:", error);
    }
}

// ---------- RENDER ITEMS ----------
function renderItems() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;

    const filtered = items.filter(item => {
        if (selectedType !== "All" && item.type !== selectedType) return false;
        if (category !== "All" && item.category !== category) return false;

        const text = (item.name + " " + item.description + " " + item.location).toLowerCase();
        return text.includes(query);
    });

    grid.innerHTML = "";

    filtered.forEach(item => {
        const isLost = item.type === "LOST";
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="card-head">
                <span class="badge ${isLost ? "lost" : "found"}">${item.type}</span>
                <span class="item-category">${escapeHtml(item.category)}</span>
            </div>
            <h3 class="item-title">${escapeHtml(item.name)}</h3>
            <p class="item-desc">${escapeHtml(item.description)}</p>
            <div class="item-meta">
                <span>📍 ${escapeHtml(item.location)}</span>
                <span>📅 ${formatDate(item.date)}</span>
            </div>
            <button class="card-btn" data-id="${item.id}">
                ${isLost ? "I Found This" : "This Is Mine"}
            </button>
        `;
        grid.appendChild(card);
    });

    if (filtered.length === 0) {
        noResults.textContent = items.length === 0
            ? "No reports yet. Be the first to report an item!"
            : "No items match your search.";
        noResults.classList.remove("hidden");
    } else {
        noResults.classList.add("hidden");
    }
}

// ---------- FILTER EVENTS ----------
searchInput.addEventListener("input", renderItems);
categoryFilter.addEventListener("change", renderItems);

chips.forEach(chip => {
    chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedType = chip.dataset.type;
        renderItems();
    });
});

// Claim button (next module mein banega)
grid.addEventListener("click", e => {
    if (e.target.classList.contains("card-btn")) {
        alert("Claim and verification will be built in the next module!");
    }
});

// ---------- MODAL ----------
function openModal(type) {
    document.getElementById("fType").value = type;
    modalTitle.textContent = type === "LOST" ? "Report a Lost Item" : "Report a Found Item";
    document.getElementById("fDate").value = new Date().toISOString().split("T")[0];
    formError.classList.add("hidden");
    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

document.getElementById("lostButton").addEventListener("click", () => openModal("LOST"));
document.getElementById("foundButton").addEventListener("click", () => openModal("FOUND"));
document.getElementById("navReportBtn").addEventListener("click", () => openModal("LOST"));
document.getElementById("closeModal").addEventListener("click", closeModal);

modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
});

// ---------- SUBMIT REPORT (POST to Java) ----------
document.getElementById("submitReport").addEventListener("click", async () => {
    const name = document.getElementById("fName").value.trim();
    const description = document.getElementById("fDesc").value.trim();
    const date = document.getElementById("fDate").value;

    if (name.length < 3 || description.length < 5 || !date) {
        formError.textContent = "Please fill name (3+ chars), description (5+ chars) and date.";
        formError.classList.remove("hidden");
        return;
    }

    const payload = {
        type: document.getElementById("fType").value,
        name: name,
        category: document.getElementById("fCategory").value,
        location: document.getElementById("fLocation").value,
        date: date,
        description: description
    };

    try {
        const response = await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Save failed");

        document.getElementById("fName").value = "";
        document.getElementById("fDesc").value = "";

        closeModal();
        await loadItems();
        await loadStats();
        document.getElementById("items").scrollIntoView();
    } catch (error) {
        formError.textContent = "Could not save the report. Please try again.";
        formError.classList.remove("hidden");
    }
});

// ---------- START ----------
loadItems();
loadStats();