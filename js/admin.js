//Firebase config (isti kao u index.js)
const firebaseConfig = {
  apiKey: "AIzaSyA2aRuGIW3jQjCqnd6hcWAk8TXsS7wmJm4",
  authDomain: "unikatni-kutak-jk-394e6.firebaseapp.com",
  databaseURL:
    "https://unikatni-kutak-jk-394e6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "unikatni-kutak-jk-394e6",
  storageBucket: "unikatni-kutak-jk-394e6.firebasestorage.app",
  messagingSenderId: "642454571103",
  appId: "1:642454571103:web:2b8937f1b2ebf394f473ea",
  measurementId: "G-4BWKK0EN4W",
};

//Init (da ne puca ako je već inicijalizirano)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const rtdb = firebase.database();
const fs = firebase.firestore(); // treba firestore-compat script u admin.html

const statusEl = document.getElementById("status");
const adminContent = document.getElementById("adminContent");
const logoutBtn = document.getElementById("logoutBtn");

const userList = document.getElementById("userList");
const orderList = document.getElementById("orderList");
const commentList = document.getElementById("commentList");

// Helper
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

// 4) Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => auth.signOut());
}

// 5) Admin provjera + load svega
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    setStatus("Niste prijavljeni. Vraćam na početnu...");
    adminContent.style.display = "none";
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  setStatus("Provjeravam admin pristup...");

  try {
    const doc = await fs.collection("admins").doc(user.uid).get();

    if (!doc.exists || doc.data()?.role !== "admin") {
      setStatus("Nemate admin prava.");
      adminContent.style.display = "none";
      alert("Nemate pristup admin stranici.");
      window.location.href = "index.html";
      return;
    }

    // Admin OK
    setStatus("Admin OK ✅ Učitavam podatke...");
    adminContent.style.display = "flex";

    loadUsersRealtime();
    loadCommentsRealtime();
    loadOrdersFirestore();
  } catch (err) {
    console.error("Admin check error:", err);
    setStatus("Greška kod provjere admina (pogledaj konzolu).");
    adminContent.style.display = "none";
  }
});

// USERS (Realtime DB: /Korisnik)

function loadUsersRealtime() {
  if (!userList) return;

  setStatus("Učitavam korisnike (Realtime)...");

  rtdb.ref("Korisnik").on(
    "value",
    (snap) => {
      userList.innerHTML = "";

      const data = snap.val();
      if (!data) {
        userList.innerHTML = "<li>Nema korisnika.</li>";
        return;
      }

      Object.keys(data).forEach((uid) => {
        const u = data[uid] || {};
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${escapeHtml(u.UserName || "korisnik")}</strong>
          <div>Email: ${escapeHtml(u.Email || "")}</div>
          <small>UID: ${escapeHtml(uid)}</small>
          <hr />
        `;
        userList.appendChild(li);
      });
    },
    (err) => {
      console.error("Users RTDB error:", err);
      userList.innerHTML = "<li>Greška pri učitavanju korisnika.</li>";
    }
  );
}

// COMMENTS (Realtime DB: komentari)

function loadCommentsRealtime() {
  if (!commentList) return;

  setStatus("Učitavam komentare...");

  rtdb.ref("komentari").on(
    "value",
    (snap) => {
      commentList.innerHTML = "";

      if (!snap.exists()) {
        commentList.innerHTML = "<li>Nema komentara.</li>";
        return;
      }

      // sortiraj novije prvo (po key ili po datum stringu, ili možemo reverse)
      const items = [];
      snap.forEach((child) => {
        items.push({ key: child.key, ...child.val() });
      });
      items.reverse();

      items.forEach((c) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${escapeHtml(c.korisnik || "Anonimni korisnik")}</strong>
          <div><small>${escapeHtml(c.datum || "")}</small></div>
          <div>${escapeHtml(c.tekst || "")}</div>
          <button data-key="${escapeHtml(
            c.key
          )}" class="del-comment">Obriši</button>
          <hr/>
        `;
        commentList.appendChild(li);
      });

      // brisanje komentara
      commentList.querySelectorAll(".del-comment").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const key = btn.dataset.key;
          if (!key) return;
          if (!confirm("Obrisati komentar?")) return;
          try {
            await rtdb.ref("komentari/" + key).remove();
          } catch (e) {
            console.error(e);
            alert("Greška kod brisanja komentara.");
          }
        });
      });
    },
    (err) => {
      console.error("Comments RTDB error:", err);
      commentList.innerHTML = "<li>Greška pri učitavanju komentara.</li>";
    }
  );
}

// ORDERS (Firestore: /orders)

function loadOrdersFirestore() {
  if (!orderList) return;

  setStatus("Učitavam narudžbe...");

  // Live listener (odmah se vide nove narudžbe)
  fs.collection("orders")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        orderList.innerHTML = "";

        if (snapshot.empty) {
          orderList.innerHTML = "<li>Nema narudžbi.</li>";
          return;
        }

        snapshot.forEach((doc) => {
          const o = doc.data() || {};
          const id = doc.id;

          const total = o.total ?? 0;
          const qty = o.qty ?? 0;

          // createdAt može biti Firestore Timestamp ili Date
          let created = "";
          if (o.createdAt) {
            created = o.createdAt.toDate
              ? o.createdAt.toDate().toLocaleString()
              : new Date(o.createdAt).toLocaleString();
          }

          const status = o.status || "novo";

          //render artikala
          const itemsHtml = (o.items || [])
            .map(
              (it) => `
              <li>
                ${escapeHtml(it.name || "")} —
                ${escapeHtml(it.visina || "")},
                ${escapeHtml(it.boja || "")},
                ${escapeHtml(it.dodatak || "")}
                x ${escapeHtml(it.kolicina || 1)}
                (${Number(it.price || 0).toFixed(2)} €)
              </li>`
            )
            .join("");

          const li = document.createElement("li");
          li.innerHTML = `
            <div style="padding:10px; border:1px solid #dad8d8ff; margin-bottom:20px;">
              <strong>Narudžba: ${escapeHtml(id)}</strong><br/>
              <small>${escapeHtml(created)}</small><br/><br/>

              <div><b>Kupac:</b> ${escapeHtml(o.name || "")}</div>
              <div><b>Email:</b> ${escapeHtml(o.email || "")}</div>
              <div><b>Telefon:</b> ${escapeHtml(o.phone || "")}</div>
              <div><b>Adresa:</b> ${escapeHtml(o.address || "")}, ${escapeHtml(
            o.city || ""
          )}</div>
              <div><b>Dostava:</b> ${escapeHtml(o.delivery || "")}</div>
              <div><b>Plaćanje:</b> ${escapeHtml(o.payment || "")}</div>

              <hr/>
              <div><b>Artikli (${qty}):</b></div>
              <ul>${itemsHtml}</ul>

              <div><b>Ukupno:</b> ${Number(total).toFixed(2)} €</div>

              <hr/>
              <div>
                <b>Status:</b>
                <select class="order-status" data-id="${escapeHtml(id)}">
                  <option value="novo" ${
                    status === "novo" ? "selected" : ""
                  }>novo</option>
                  <option value="u obradi" ${
                    status === "u obradi" ? "selected" : ""
                  }>u obradi</option>
                  <option value="poslano" ${
                    status === "poslano" ? "selected" : ""
                  }>poslano</option>
                  <option value="završeno" ${
                    status === "završeno" ? "selected" : ""
                  }>završeno</option>
                </select>

                <button class="del-order" data-id="${escapeHtml(
                  id
                )}">Obriši</button>
              </div>
            </div>
          `;

          orderList.appendChild(li);
        });
        //kad promijenim status u selectu napravi se update Firestora
        // promjena statusa
        orderList.querySelectorAll(".order-status").forEach((sel) => {
          sel.addEventListener("change", async () => {
            const id = sel.dataset.id;
            const newStatus = sel.value;
            if (!id) return;
            try {
              await fs
                .collection("orders")
                .doc(id)
                .update({ status: newStatus });
            } catch (e) {
              console.error(e);
              alert("Greška kod promjene statusa.");
            }
          });
        });

        // brisanje narudžbe
        orderList.querySelectorAll(".del-order").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            if (!id) return;
            if (!confirm("Obrisati narudžbu?")) return;
            try {
              await fs.collection("orders").doc(id).delete();
            } catch (e) {
              console.error(e);
              alert("Greška kod brisanja narudžbe.");
            }
          });
        });

        setStatus("Sve učitano ✅");
      },
      (err) => {
        console.error("Orders Firestore error:", err);
        orderList.innerHTML = "<li>Greška pri učitavanju narudžbi.</li>";
        setStatus("Greška kod narudžbi.");
      }
    );
}
