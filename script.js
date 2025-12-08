// On utilise le SDK modulaire via les URLs (pas besoin d'installation)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
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
const listEl = document.getElementById("tricksList");

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

    div.appendChild(title);
    div.appendChild(desc);

    listEl.appendChild(div);
  });
}

// === Écoute en temps réel de la collection "tricks" ===
const tricksRef = collection(db, "tricks");
const q = query(tricksRef, orderBy("name"));

onSnapshot(q, (snapshot) => {
  const tricks = [];
  snapshot.forEach((doc) => {
    tricks.push({ id: doc.id, ...doc.data() });
  });
  renderTricks(tricks);
});

// === Gestion du formulaire d'ajout ===
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!name || !description) {
    alert("Remplis le nom et la description.");
    return;
  }

  try {
    await addDoc(tricksRef, {
      name,
      description,
      createdAt: new Date(),
    });

    // Reset du formulaire
    form.reset();
  } catch (err) {
    console.error("Erreur lors de l'ajout du trick :", err);
    alert("Impossible d'ajouter le trick (regarde la console).");
  }
});
