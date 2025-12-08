// SDK modulaire via URL
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDvb4C14F_fTsUsgZJyjwMT8UBYO58XN2s",
  authDomain: "dali-050.firebaseapp.com",
  projectId: "dali-050",
  storageBucket: "dali-050.firebasestorage.app",
  messagingSenderId: "1068512065598",
  appId: "1:1068512065598:web:07deb7f679fcaa0b39b96f",
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const form = document.getElementById("trickForm");
const nameInput = document.getElementById("trickName");
const descInput = document.getElementById("trickDescription");
const imageUrlInput = document.getElementById("trickImageUrl");
const categoryInput = document.getElementById("trickCategory");
const statusInput = document.getElementById("trickStatus");
const listEl = document.getElementById("tricksList");
const editInfo = document.getElementById("editInfo");
const editNameSpan = document.getElementById("editName");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const submitBtn = document.getElementById("submitBtn");
const filterCategorySelect = document.getElementById("filterCategory");

// Statuts
const STATUS_OPTIONS = [
  { value: "learning", label: "Apprentissage" },
  { value: "acquired", label: "Acquis" },
];

// Catégories
const CATEGORY_OPTIONS = [
  { value: "obedience", label: "Obéissance" },
  { value: "fun", label: "Fun / Tricks" },
  { value: "sport", label: "Sport / Agility" },
  { value: "useful", label: "Utile au quotidien" },
  { value: "other", label: "Autre" },
];

function categoryLabel(value) {
  const found = CATEGORY_OPTIONS.find((c) => c.value === value);
  return found ? found.label : "Autre";
}

let currentEditId = null;
let currentTricks = [];
let currentCategoryFilter = "all";

// Affichage des tricks
function renderTricks(tricks) {
  listEl.innerHTML = "";

  if (tricks.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Aucun trick pour le moment.";
    listEl.appendChild(p);
    return;
  }

  tricks.forEach((t) => {
    const div = document.createElement("div");
    div.className = "trick";

    const headerRow = document.createElement("div");
    headerRow.className = "trick-header-row";

    const leftPart = document.createElement("div");

    const titleRow = document.createElement("div");
    titleRow.className = "trick-title-row";

    const title = document.createElement("div");
    title.className = "trick-title";
    title.textContent = t.name;

    const catBadge = document.createElement("span");
    catBadge.className = "trick-category-badge";
    catBadge.textContent = categoryLabel(t.category || "other");

    titleRow.appendChild(title);
    titleRow.appendChild(catBadge);

    const desc = document.createElement("div");
    desc.className = "trick-description";
    desc.textContent = t.description;

    leftPart.appendChild(titleRow);
    leftPart.appendChild(desc);

    // Image éventuelle
    if (t.imageUrl) {
      const img = document.createElement("img");
      img.className = "trick-image";
      img.src = t.imageUrl;
      img.alt = `Illustration pour ${t.name}`;
      leftPart.appendChild(img);
    }

    const rightPart = document.createElement("div");
    rightPart.className = "trick-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-secondary";
    editBtn.textContent = "Modifier";
    editBtn.addEventListener("click", () => {
      enterEditMode(t);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "Supprimer";
    deleteBtn.addEventListener("click", async () => {
      const ok = confirm(`Supprimer le trick "${t.name}" ?`);
      if (!ok) return;
      try {
        await deleteDoc(doc(db, "tricks", t.id));
      } catch (err) {
        console.error("Erreur lors de la suppression :", err);
        alert("Impossible de supprimer ce trick.");
      }
    });

    rightPart.appendChild(editBtn);
    rightPart.appendChild(deleteBtn);

    headerRow.appendChild(leftPart);
    headerRow.appendChild(rightPart);

    const statusRow = document.createElement("div");
    statusRow.className = "trick-status-row";

    const labelSpan = document.createElement("span");
    labelSpan.textContent = "État :";

    const select = document.createElement("select");
    select.className = "status-select";

    STATUS_OPTIONS.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      if ((t.status || "learning") === opt.value) {
        o.selected = true;
      }
      select.appendChild(o);
    });

    select.addEventListener("change", async (e) => {
      const newStatus = e.target.value;
      try {
        await updateDoc(doc(db, "tricks", t.id), { status: newStatus });
      } catch (err) {
        console.error("Erreur lors de la mise à jour du statut :", err);
        alert("Impossible de mettre à jour le statut.");
      }
    });

    statusRow.appendChild(labelSpan);
    statusRow.appendChild(select);

    div.appendChild(headerRow);
    div.appendChild(statusRow);

    listEl.appendChild(div);
  });
}

// Appliquer le filtre catégorie
function applyFilterAndRender() {
  let toRender = currentTricks;

  if (currentCategoryFilter !== "all") {
    toRender = currentTricks.filter(
      (t) => (t.category || "other") === currentCategoryFilter
    );
  }

  renderTricks(toRender);
}

// Mode édition
function enterEditMode(trick) {
  currentEditId = trick.id;
  nameInput.value = trick.name || "";
  descInput.value = trick.description || "";
  imageUrlInput.value = trick.imageUrl || "";
  categoryInput.value = trick.category || "other";
  statusInput.value = trick.status || "learning";

  editNameSpan.textContent = trick.name || "";
  editInfo.style.display = "block";
  submitBtn.textContent = "Enregistrer";
}

function exitEditMode() {
  currentEditId = null;
  form.reset();
  categoryInput.value = "obedience";
  statusInput.value = "learning";
  editInfo.style.display = "none";
  submitBtn.textContent = "Ajouter";
}

cancelEditBtn.addEventListener("click", () => {
  exitEditMode();
});

// Firestore temps réel
const tricksRef = collection(db, "tricks");
const q = query(tricksRef, orderBy("name"));

onSnapshot(q, (snapshot) => {
  const tricks = [];
  snapshot.forEach((docSnap) => {
    tricks.push({ id: docSnap.id, ...docSnap.data() });
  });
  currentTricks = tricks;
  applyFilterAndRender();
});

// Filtre catégorie
filterCategorySelect.addEventListener("change", (e) => {
  currentCategoryFilter = e.target.value;
  applyFilterAndRender();
});

// Formulaire ajout / édition
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const description = descInput.value.trim();
  const imageUrl = imageUrlInput.value.trim();
  const category = categoryInput.value || "other";
  const status = statusInput.value || "learning";

  if (!name || !description) {
    alert("Remplis le nom et la description.");
    return;
  }

  const payload = {
    name,
    description,
    status,
    category,
    imageUrl: imageUrl || null,
  };

  try {
    if (currentEditId) {
      await updateDoc(doc(db, "tricks", currentEditId), payload);
    } else {
      await addDoc(tricksRef, {
        ...payload,
        createdAt: new Date(),
      });
    }

    exitEditMode();
  } catch (err) {
    console.error("Erreur lors de l'enregistrement du trick :", err);
    alert("Impossible d'enregistrer le trick (regarde la console).");
  }
});
