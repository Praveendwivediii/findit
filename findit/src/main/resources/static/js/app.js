// ---------- SAMPLE DATA (baad mein MySQL se aayega) ----------
let items = [
    { id: 1, type: "LOST", name: "Black Leather Wallet", category: "Accessories",
      location: "Library", date: "2026-11-03",
      desc: "Black wallet with a college ID card inside.", status: "ACTIVE" },
    { id: 2, type: "FOUND", name: "Blue Water Bottle", category: "Other",
      location: "Cafeteria", date: "2026-11-04",
      desc: "Milton bottle with a sticker on the side.", status: "ACTIVE" },
    { id: 3, type: "FOUND", name: "Samsung Phone", category: "Electronics",
      location: "Lab Block", date: "2026-11-05",
      desc: "Black Samsung phone with a cracked back cover.", status: "ACTIVE" },
    { id: 4, type: "LOST", name: "Blue Backpack", category: "Bags",
      location: "Main Gate", date: "2026-11-02",
      desc: "Dark blue backpack with a superhero keychain.", status: "ACTIVE" },
    { id: 5, type: "FOUND", name: "College ID Card", category: "ID/Documents",
      location: "Auditorium", date: "2026-11-01",
      desc: "MCA first year student ID card.", status: "RETURNED" },
    { id: 6, type: "LOST", name: "Java Textbook", category: "Books",
      location: "Hostel", date: "2026-11-06",
      desc: "Java: The Complete Reference, name written inside.", status: "ACTIVE" }
];

let nextId = 7;
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

// ---------- STATS ----------
function updateStats() {
    document.getElementById("statLost").textContent =
        items.filter(i => i.type === "LOST").length;
    document.getElementById("statFound").textContent =
        items.filter(i => i.type === "FOUND").length;
    document.getElementById("statReturned").textContent =
        items.filter(i => i.status === "RETURNED").length;
}

// ---------- RENDER ITEMS ----------
function renderItems() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;

    // Returned items active feed se bahar
    const filtered = items.filter(item => {
        if (item.status === "RETURNED") return false;
        if (selectedType !== "All" && item.type !== selectedType) return false;
        if (category !== "All" && item.category !== category) return false;

        const text = (item.name + " " + item.desc + " " + item.location).toLowerCase();
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
            <p class="item-desc">${escapeHtml(item.desc)}</p>
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

    noResults.classList.toggle("hidden", filtered.length > 0);
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

// Card button (claim abhi placeholder hai)
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

// ---------- SUBMIT REPORT ----------
document.getElementById("submitReport").addEventListener("click", () => {
    const name = document.getElementById("fName").value.trim();
    const desc = document.getElementById("fDesc").value.trim();
    const date = document.getElementById("fDate").value;

    if (name.length < 3 || desc.length < 5 || !date) {
        formError.textContent = "Please fill name (3+ chars), description (5+ chars) and date.";
        formError.classList.remove("hidden");
        return;
    }

    items.unshift({
        id: nextId++,
        type: document.getElementById("fType").value,
        name: name,
        category: document.getElementById("fCategory").value,
        location: document.getElementById("fLocation").value,
        date: date,
        desc: desc,
        status: "ACTIVE"
    });

    document.getElementById("fName").value = "";
    document.getElementById("fDesc").value = "";

    closeModal();
    updateStats();
    renderItems();
    document.getElementById("items").scrollIntoView();
});

// ---------- START ----------
updateStats();
renderItems();