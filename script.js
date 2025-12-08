// On utilise le SDK modulaire via les URLs (pas besoin d'installation)
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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Config de TON projet Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyDvb4C14F_fTsUsgZJyjwMT8UBYO58XN2s",
  authDomain: "dali-050.firebaseapp.com",
  projectId: "dali-050",
  storageBucket: "dali-050.firebasestorage.app",
  messagingSenderId: "1068512065598",
  appId: "1:1068512065598:web:07deb7f679fcaa0b39b96f",
};

// Initialisation Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Références DOM
const form = document.getElementById("trickForm");
const nameInput = document.getElementById("trickName");
const descInput = document.getElementById("trickDescription");
const statusInput = document.getElementById("trickStatus");
const listEl = document.getElementById("tricksList");

// Statuts possibles
const STATUS_OPTIONS = [
  { value: "learning", label: "Apprentissage" },
  { value: "acquired", label: "Acquis" },
];

function statusLabel(value) {
  const found = STATUS_OPTIONS.find((s) => s.value === value);
  return found ? found.label : "Apprentissage";
}

// === Fonction d'affichage de la liste ===
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

    const title = document.createElement("div");
    title.className = "trick-title";
    title.textContent = t.name;

    const desc = document.createElement("div");
    desc.className = "trick-description";
    desc.textContent = t.description;

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

    div.appendChild(title);
    div.appendChild(desc);
    div.appendChild(statusRow);

    listEl.appendChild(div);
  });
}

// === Écoute en temps réel de la collection "tricks" ===
const tricksRef = collection(db, "tricks");
const q = query(tricksRef, orderBy("name"));

onSnapshot(q, (snapshot) => {
  const tricks = [];
  snapshot.forEach((docSnap) => {
    tricks.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderTricks(tricks);
});

// === Gestion du formulaire d'ajout ===
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const description = descInput.value.trim();
  const status = statusInput.value || "learning";

  if (!name || !description) {
    alert("Remplis le nom et la description.");
    return;
  }

  try {
    await addDoc(tricksRef, {
      name,
      description,
      status,
      createdAt: new Date(),
    });

    form.reset();
    statusInput.value = "learning";
  } catch (err) {
    console.error("Erreur lors de l'ajout du trick :", err);
    alert("Impossible d'ajouter le trick (regarde la console).");
  }
});
