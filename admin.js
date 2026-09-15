alert("ADMIN JS OK");
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
} from "./supabase.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginForm = document.querySelector("#login");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginResult = document.querySelector("#loginResult");
const dashboard = document.querySelector("#dashboard");
const list = document.querySelector("#list");
const refreshBtn = document.querySelector("#refresh");
const searchInput = document.querySelector("#search");

let complaints = [];
let technicians = [];

// =========================
// LOGIN
// =========================

loginForm?.addEventListener("submit", async (e) => {
  alert("LOGIN BUTTON WORKING");
  e.preventDefault();

  loginResult.textContent = "Login हो रहा है...";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginResult.textContent = "❌ " + error.message;
    return;
  }

  loginResult.textContent = "";
  loginForm.style.display = "none";
  dashboard.style.display = "block";

  addLogoutButton();

  await loadAll();
});

// =========================
// EXISTING SESSION
// =========================

const { data: sessionData } =
  await supabase.auth.getSession();

if (sessionData?.session) {
  loginForm.style.display = "none";
  dashboard.style.display = "block";

  addLogoutButton();

  await loadAll();
}

// =========================
// LOAD ALL DATA
// =========================

async function loadAll() {
  list.textContent = "Complaints load हो रही हैं...";

  await Promise.all([
    loadComplaints(),
    loadTechnicians()
  ]);

  renderComplaints(complaints);
}

// =========================
// LOAD COMPLAINTS
// =========================

async function loadComplaints() {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.textContent = "❌ " + error.message;
    return;
  }

  complaints = data || [];

  updateCounters();
}

// =========================
// LOAD TECHNICIANS
// =========================

async function loadTechnicians() {
  const { data, error } = await supabase
    .from("technicians")
    .select("id,name,phone,areal,status")
    .order("name", { ascending: true });

  if (error) {
    console.log("Technicians load error:", error.message);
    technicians = [];
    return;
  }

  technicians = data || [];
}

// =========================
// COUNTERS
// =========================

function updateCounters() {
  const total = complaints.length;

  const pending = complaints.filter(
    x => x.status === "Pending"
  ).length;

  const progress = complaints.filter(
    x => x.status === "In Progress"
  ).length;

  const completed = complaints.filter(
    x => x.status === "Completed"
  ).length;

  const totalCount = document.querySelector("#totalCount");
  const pendingCount = document.querySelector("#pendingCount");
  const progressCount = document.querySelector("#progressCount");
  const completedCount = document.querySelector("#completedCount");

  if (totalCount) totalCount.textContent = total;
  if (pendingCount) pendingCount.textContent = pending;
  if (progressCount) progressCount.textContent = progress;
  if (completedCount) completedCount.textContent = completed;
}

// =========================
// RENDER COMPLAINTS
// =========================

function renderComplaints(data) {
  list.innerHTML = "";

  if (!data.length) {
    list.textContent = "❌ कोई complaint नहीं मिली।";
    return;
  }

  data.forEach((row) => {

    const article = document.createElement("article");
    article.className = "complaint-card";

    const title = document.createElement("h3");
    title.textContent =
      "📋 " + (row.complaint_number || row.id);

    const name = document.createElement("div");
    name.textContent =
      "👤 नाम: " + (row.customer_name || "-");

    const phone = document.createElement("div");
    phone.textContent =
      "📱 मोबाइल: " + (row.phone || "-");

    const service = document.createElement("div");
    service.textContent =
      "🔧 Service: " + (row.service || "-");

    const problem = document.createElement("div");
    problem.textContent =
      "⚠️ समस्या: " + (row.problem || "-");

    const address = document.createElement("div");
    address.textContent =
      "📍 Address: " + (row.address || "-");

    const date = document.createElement("div");

    if (row.created_at) {
      const d = new Date(row.created_at);

      date.textContent =
        "📅 Date: " + d.toLocaleString("en-IN");
    } else {
      date.textContent = "📅 Date: -";
    }

    // STATUS
    const statusLabel = document.createElement("p");
    statusLabel.textContent = "Status: ";

    const status = document.createElement("select");
    status.className = "status-select";

    [
      "Pending",
      "Assigned",
      "In Progress",
      "Completed"
    ].forEach((statusName) => {

      const option =
        document.createElement("option");

      option.value = statusName;
      option.textContent = statusName;

      status.appendChild(option);
    });

    status.value = row.status || "Pending";

    status.addEventListener("change", async () => {

      const newStatus = status.value;

      status.disabled = true;

      const { error } = await supabase
        .from("complaints")
        .update({
          status: newStatus
        })
        .eq("id", row.id);

      status.disabled = false;

      if (error) {
        alert(
          "❌ Status update error: " +
          error.message
        );

        status.value =
          row.status || "Pending";

        return;
      }

      row.status = newStatus;

      updateCounters();

      alert(
        "✅ Status successfully update हो गया।"
      );
    });

    statusLabel.appendChild(status);

    // TECHNICIAN
    const technicianLabel =
      document.createElement("p");

    technicianLabel.textContent =
      "🧑‍🔧 Technician: ";

    const technicianSelect =
      document.createElement("select");

    technicianSelect.className =
      "technician-select";

    const noTech =
      document.createElement("option");

    noTech.value = "";
    noTech.textContent =
      "Technician चुनें";

    technicianSelect.appendChild(noTech);

    technicians.forEach((tech) => {

      const option =
        document.createElement("option");

      option.value = tech.id;

      option.textContent =
        tech.name +
        (tech.status
          ? " (" + tech.status + ")"
          : "");

      technicianSelect.appendChild(option);
    });

    if (row.technician_id) {
      technicianSelect.value =
        row.technician_id;
    }

    technicianSelect.addEventListener(
      "change",
      async () => {

        const technicianId =
          technicianSelect.value || null;

        technicianSelect.disabled = true;

        const { error } = await supabase
          .from("complaints")
          .update({
            technician_id: technicianId
          })
          .eq("id", row.id);

        technicianSelect.disabled = false;

        if (error) {
          alert(
            "❌ Technician assign error: " +
            error.message
          );

          technicianSelect.value =
            row.technician_id || "";

          return;
        }

        row.technician_id =
          technicianId;

        alert(
          "✅ Technician successfully assign हो गया।"
        );
      }
    );

    technicianLabel.appendChild(
      technicianSelect
    );

    // ACTION BUTTONS
    const actions =
      document.createElement("div");

    actions.className = "actions";

    // CALL
    if (row.phone) {

      const call =
        document.createElement("a");

      call.href =
        "tel:" + row.phone;

      call.className =
        "call-btn";

      call.textContent =
        "📞 Call";

      actions.appendChild(call);
    }

    // WHATSAPP
    if (row.phone) {

      const whatsapp =
        document.createElement("a");

      const cleanPhone =
        row.phone.replace(/\D/g, "");

      const whatsappPhone =
        cleanPhone.length === 10
          ? "91" + cleanPhone
          : cleanPhone;

      const message =
        "Raja Refrigeration Complaint " +
        (row.complaint_number || "") +
        " के बारे में संपर्क कर रहे हैं।";

      whatsapp.href =
        "https://wa.me/" +
        whatsappPhone +
        "?text=" +
        encodeURIComponent(message);

      whatsapp.target = "_blank";
      whatsapp.rel =
        "noopener noreferrer";

      whatsapp.className =
        "whatsapp-btn";

      whatsapp.textContent =
        "💬 WhatsApp";

      actions.appendChild(whatsapp);
    }

    // PHOTO
    if (row.photo_url) {

      const photo =
        document.createElement("a");

      photo.href = row.photo_url;
      photo.target = "_blank";
      photo.rel =
        "noopener noreferrer";

      photo.className =
        "photo-btn";

      photo.textContent =
        "📷 Photo देखें";

      actions.appendChild(photo);
    }

    article.appendChild(title);
    article.appendChild(name);
    article.appendChild(phone);
    article.appendChild(service);
    article.appendChild(problem);
    article.appendChild(address);
    article.appendChild(date);
    article.appendChild(statusLabel);
    article.appendChild(technicianLabel);
    article.appendChild(actions);

    list.appendChild(article);
  });
}

// =========================
// SEARCH
// =========================

searchInput?.addEventListener(
  "input",
  () => {

    const q =
      searchInput.value
        .trim()
        .toLowerCase();

    if (!q) {
      renderComplaints(complaints);
      return;
    }

    const filtered =
      complaints.filter((row) => {

        return [
          row.complaint_number,
          row.customer_name,
          row.phone,
          row.service,
          row.problem,
          row.address
        ]
          .filter(Boolean)
          .some(value =>
            String(value)
              .toLowerCase()
              .includes(q)
          );
      });

    renderComplaints(filtered);
  }
);

// =========================
// REFRESH
// =========================

refreshBtn?.addEventListener(
  "click",
  async () => {

    refreshBtn.disabled = true;

    await loadAll();

    refreshBtn.disabled = false;
  }
);

// =========================
// LOGOUT
// =========================

function addLogoutButton() {

  if (document.querySelector("#logout")) {
    return;
  }

  const logout =
    document.createElement("button");

  logout.id = "logout";
  logout.className = "btn";
  logout.textContent = "🚪 Logout";

  logout.style.marginBottom =
    "15px";

  logout.addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();

      dashboard.style.display =
        "none";

      loginForm.style.display =
        "block";

      loginForm.reset();

      loginResult.textContent =
        "Logout हो गया।";

      logout.remove();
    }
  );

  dashboard.prepend(logout);
}
```
