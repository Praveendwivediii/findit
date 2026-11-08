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
let claimItemId = null;
let currentUser = null;

// ---------- ELEMENTS ----------
const grid = document.getElementById("itemsGrid");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const chips = document.querySelectorAll(".chip");

const modal = document.getElementById("reportModal");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");
const fType = document.getElementById("fType");
const foundFields = document.getElementById("foundFields");

const claimModal = document.getElementById("claimModal");
const claimForm = document.getElementById("claimForm");
const claimResult = document.getElementById("claimResult");
const claimError = document.getElementById("claimError");

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

function goToLogin() {
    // Loop se bachne ke liye: 10 second mein sirf ek baar redirect
    const last = Number(sessionStorage.getItem("findit-redirect") || 0);
    if (Date.now() - last < 10000) {
        document.body.insertAdjacentHTML("afterbegin",
            '<div style="padding:12px;background:#e11d48;color:#fff;text-align:center;position:relative;z-index:999">' +
            'Login required, but the server did not accept your session. Press F12 and open Console.</div>');
        return;
    }
    sessionStorage.setItem("findit-redirect", String(Date.now()));
    window.location.href = "/login.html";
}

// ---------- API HELPERS ----------
// GET request. Login nahi hai (401) to seedha login page par.
async function apiGet(url) {
    const response = await fetch(url);
    if (response.status === 401) {
        console.warn("401 from:", url); // added this in last
        goToLogin();
        throw new Error("Not logged in");
    }
    return response;
}

// POST request. Har POST ke saath fresh CSRF token jata hai.
async function apiPost(url, body) {
    const csrfResponse = await fetch("/api/auth/csrf");
    const csrf = await csrfResponse.json();

    const headers = { "Content-Type": "application/json" };
    headers[csrf.headerName] = csrf.token;

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (response.status === 401) {
        goToLogin();
        throw new Error("Not logged in");
    }
    return response;
}

// ---------- CURRENT USER ----------
async function loadUser() {
    try {
        const response = await apiGet("/api/auth/me");
        if (!response.ok) return;
        currentUser = await response.json();

        const nameEl = document.getElementById("userName");
        if (nameEl) nameEl.textContent = "Hi, " + currentUser.name.split(" ")[0];
    } catch (error) {
        // apiGet pehle hi redirect kar chuka hai
    }
}

// ---------- LOGOUT ----------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await apiPost("/api/auth/logout");
        } catch (error) {
            // koi baat nahi, neeche redirect ho jayega
        }
        goToLogin();
    });
}

// ---------- LOAD DATA ----------
async function loadItems() {
    try {
        const response = await apiGet("/api/items");
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
        const response = await apiGet("/api/items/stats");
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
            <button class="card-btn" data-id="${item.id}" data-type="${item.type}">
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

// ---------- CARD BUTTON ----------
grid.addEventListener("click", e => {
    const btn = e.target.closest(".card-btn");
    if (!btn) return;

    const id = Number(btn.dataset.id);

    if (btn.dataset.type === "FOUND") {
        openClaim(id);
    } else {
        const lostItem = items.find(i => i.id === id);
        openModal("FOUND");
        if (lostItem) {
            document.getElementById("fName").value = lostItem.name;
            document.getElementById("fCategory").value = lostItem.category;
        }
    }
});

// ---------- REPORT MODAL ----------
function toggleFoundFields() {
    foundFields.classList.toggle("hidden", fType.value !== "FOUND");
}

function openModal(type) {
    fType.value = type;
    modalTitle.textContent = type === "LOST" ? "Report a Lost Item" : "Report a Found Item";
    document.getElementById("fDate").value = new Date().toISOString().split("T")[0];
    formError.classList.add("hidden");
    toggleFoundFields();

    // Login wale user ka naam/email pehle se bhar do (badal sakte hain)
    if (currentUser) {
        const nameField = document.getElementById("fContactName");
        const infoField = document.getElementById("fContactInfo");
        if (!nameField.value) nameField.value = currentUser.name;
        if (!infoField.value) infoField.value = currentUser.email;
    }

    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

fType.addEventListener("change", () => {
    modalTitle.textContent = fType.value === "LOST" ? "Report a Lost Item" : "Report a Found Item";
    toggleFoundFields();
});

document.getElementById("lostButton").addEventListener("click", () => openModal("LOST"));
document.getElementById("foundButton").addEventListener("click", () => openModal("FOUND"));
document.getElementById("navReportBtn").addEventListener("click", () => openModal("LOST"));
document.getElementById("closeModal").addEventListener("click", closeModal);

modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
});

// ---------- SUBMIT REPORT ----------
document.getElementById("submitReport").addEventListener("click", async () => {
    const type = fType.value;
    const name = document.getElementById("fName").value.trim();
    const description = document.getElementById("fDesc").value.trim();
    const date = document.getElementById("fDate").value;

    if (name.length < 3 || description.length < 5 || !date) {
        formError.textContent = "Please fill name (3+ chars), description (5+ chars) and date.";
        formError.classList.remove("hidden");
        return;
    }

    const payload = {
        type: type,
        name: name,
        category: document.getElementById("fCategory").value,
        location: document.getElementById("fLocation").value,
        date: date,
        description: description
    };

    if (type === "FOUND") {
        payload.verificationQuestion = document.getElementById("fQuestion").value.trim();
        payload.verificationAnswer = document.getElementById("fAnswer").value.trim();
        payload.contactName = document.getElementById("fContactName").value.trim();
        payload.contactInfo = document.getElementById("fContactInfo").value.trim();

        if (!payload.verificationQuestion || !payload.verificationAnswer
                || !payload.contactName || !payload.contactInfo) {
            formError.textContent = "Found reports need a question, its answer, your name and your contact.";
            formError.classList.remove("hidden");
            return;
        }
    }

    try {
        const response = await apiPost("/api/items", payload);
        if (!response.ok) throw new Error("Save failed");

        ["fName", "fDesc", "fQuestion", "fAnswer", "fContactName", "fContactInfo"]
            .forEach(id => { document.getElementById(id).value = ""; });

        closeModal();
        await loadItems();
        await loadStats();
        document.getElementById("items").scrollIntoView();
    } catch (error) {
        formError.textContent = "Could not save the report. Please check the fields and try again.";
        formError.classList.remove("hidden");
    }
});

// ---------- CLAIM FLOW ----------
async function openClaim(id) {
    try {
        const response = await apiGet("/api/items/" + id + "/question");
        if (!response.ok) {
            alert("This item has no verification question set, so it cannot be claimed online.");
            return;
        }
        const data = await response.json();

        claimItemId = id;
        document.getElementById("claimQuestion").textContent = data.question;
        document.getElementById("cAnswer").value = "";
        document.getElementById("cName").value = currentUser ? currentUser.name : "";
        document.getElementById("cContact").value = currentUser ? currentUser.email : "";
        claimError.classList.add("hidden");
        claimForm.classList.remove("hidden");
        claimResult.classList.add("hidden");
        claimModal.classList.remove("hidden");
    } catch (error) {
        console.error("Claim open failed:", error);
    }
}

function closeClaim() {
    claimModal.classList.add("hidden");
    claimItemId = null;
}

document.getElementById("closeClaim").addEventListener("click", closeClaim);

claimModal.addEventListener("click", e => {
    if (e.target === claimModal) closeClaim();
});

document.getElementById("submitClaim").addEventListener("click", async () => {
    const answer = document.getElementById("cAnswer").value.trim();
    const claimantName = document.getElementById("cName").value.trim();
    const claimantContact = document.getElementById("cContact").value.trim();

    if (!answer || !claimantName || !claimantContact) {
        claimError.textContent = "Please fill your answer, name and contact.";
        claimError.classList.remove("hidden");
        return;
    }

    try {
        const response = await apiPost("/api/items/" + claimItemId + "/claim",
                { claimantName, claimantContact, answer });

        if (response.status === 429) {
            claimError.textContent = "No attempts left for this item. Please contact campus security.";
            claimError.classList.remove("hidden");
            return;
        }

        if (!response.ok) throw new Error("Claim failed");

        const data = await response.json();

        if (data.approved) {
            document.getElementById("resName").textContent = data.finderName;
            document.getElementById("resContact").textContent = data.finderContact;
            claimForm.classList.add("hidden");
            claimResult.classList.remove("hidden");
        } else {
            claimError.textContent = "Wrong answer. Attempts left: " + data.attemptsLeft;
            claimError.classList.remove("hidden");
        }
    } catch (error) {
        claimError.textContent = "Something went wrong. Please try again.";
        claimError.classList.remove("hidden");
    }
});

// ---------- ESC KEY ----------
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeModal();
        closeClaim();
    }
});

// ---------- START ----------
loadUser();
loadItems();
loadStats();