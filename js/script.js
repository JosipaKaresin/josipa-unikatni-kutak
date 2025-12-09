//Dropdown i karta
let map = null;
function toggleDropdown(event) {
  event.preventDefault();

  const clickedLi = event.target.closest(".dropdown");
  const allDropdowns = document.querySelectorAll(".dropdown");

  allDropdowns.forEach((li) => {
    if (li !== clickedLi) li.classList.remove("open");
  });

  clickedLi.classList.toggle("open");

  const mapContainer = clickedLi.querySelector("#map");
  if (mapContainer && clickedLi.classList.contains("open")) {
    setTimeout(() => {
      if (!map) {
        // prvi put kreiraj kartu
        map = L.map("map").setView([45.17827, 18.02746], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/">OtvoriStreetMap</a>',
        }).addTo(map);

        L.marker([45.17827, 18.02746])
          .addTo(map)
          .bindPopup(
            "<b>Unikatni kutak JK</b><br>Slavonski Brod<br>Augustina Kažotića 157"
          )
          .openPopup();
      } else {
        // ako je već kreirana, samo je “osvježi”
        map.invalidateSize();
      }
    }, 300);
  }
}

function closeDropdown(closeBtn) {
  const subnav = closeBtn.closest(".dropdown");
  subnav.classList.remove("open");
}

// window.onclick = function (event) {
//   if (event.target == popup) {
//     popup.style.display = "none";
//   }
// };

//datum i vrijeme
function updateDateTime() {
  const vrijeme = new Date();

  const dan = vrijeme.getDate();
  const mjesec = vrijeme.getMonth() + 1; // mjeseci počinju od 0
  const godina = vrijeme.getFullYear();
  const sati = vrijeme.getHours().toString().padStart(2, "0");
  const minute = vrijeme.getMinutes().toString().padStart(2, "0");
  const sekunde = vrijeme.getSeconds().toString().padStart(2, "0");

  const noviFormat = `${sati}:${minute}:${sekunde}, ${dan}.${mjesec}.${godina}.`;

  document.getElementById("datetime").textContent = noviFormat;
}

updateDateTime();

setInterval(updateDateTime, 1000);

//prijava i registracija

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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); //FIREBASE AUTENTIFIKACIJA
const db = firebase.database(); //FIREBASE REALTIME DATABASE

const authSection = document.getElementById("auth");
const appSection = document.getElementById("app");
const stavkeList = document.getElementById("dataList");
const dobrodosli = document.getElementById("dobrodosli");
const itemInput = document.getElementById("itemInput");
const listRef = db.ref("stavke");

let currentUser;

function emailInput() {
  return document.getElementById("email").value.trim();
}

function passwordInput() {
  return document.getElementById("password").value.trim();
}

document.getElementById("btnRegister").addEventListener("click", async () => {
  const email = emailInput();
  const password = passwordInput();

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );

    const uid = userCredential.user.uid;
    currentUser = userCredential.user;

    //DODAVANJE KORISNIKA U REALTIME DATABASE PREKO UID-A AUTENTHICATION DIJELA
    await db.ref(`Korisnik/${uid}`).set({
      Email: email,
      Id: uid,
      UserName: email.split("@")[0],
    });

    dobrodosli.innerHTML = `Dobrodosli ${currentUser.email}`;
    alert("Registracija uspješna");
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("btnLogin").addEventListener("click", () => {
  const email = emailInput();
  const password = passwordInput();

  auth
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      currentUser = { email: email };
      dobrodosli.innerHTML = `Dobrodosli ${currentUser.email}`;
      alert("Prijava uspješna");
    })
    .catch((err) => {
      alert(err.message);
    });
});

document.getElementById("btnLogout").addEventListener("click", () => {
  auth.signOut();
});

//PRAĆENJE STATUSA PRIJAVA
auth.onAuthStateChanged((user) => {
  if (user) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    loadData();
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
});

/* dodavanje*/
document.getElementById("btnAdd").addEventListener("click", () => {
  const text = itemInput.value.trim();
  if (text == "") {
    alert("Niste unijeli stavku za unos");
  }

  const newRef = listRef.push();
  newRef.set({ naziv: text });
  itemInput.value = "";
});

//Ispis stavki
function loadData() {
  listRef.on("value", (snapshot) => {
    const data = snapshot.val();
    stavkeList.innerHTML = "";

    for (let id in data) {
      const li = document.createElement("li");
      li.textContent = data[id].naziv;

      //ažuriranje stavki
      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Uredi";
      btnEdit.onclick = () => {
        const noviNaziv = prompt("Novi naziv", data[id].naziv);
        if (noviNaziv) {
          db.ref(`stavke/${id}`).update({ naziv: noviNaziv });
        }
      };

      //brisanje
      const btnDelete = document.createElement("button");
      btnDelete.textContent = "Obriši";
      btnDelete.onclick = () => {
        db.ref(`stavke/${id}`).remove();
      };

      li.appendChild(btnEdit);
      li.appendChild(btnDelete);
      stavkeList.appendChild(li);
    }
  });
}

//komentari
const komentarForm = document.getElementById("komentarForm");
const komentarInput = document.getElementById("komentarInput");
const komentarLista = document.getElementById("komentarLista");

komentarForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const tekst = komentarInput.value.trim();
  if (tekst === "") return;
  console.log("komentar poslan", tekst);

  const user = firebase.auth().currentUser;
  const userName = user ? user.email : "Anonimni korisnik";

  const newKomentarRef = firebase.database().ref("komentari").push();
  newKomentarRef.set({
    tekst: tekst,
    korisnik: userName,
    datum: new Date().toLocaleString(),
  });

  komentarInput.value = "";
});

firebase
  .database()
  .ref("komentari")
  .on("value", (snapshot) => {
    komentarLista.innerHTML = "";
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const li = document.createElement("li");
      li.innerHTML = `<strong>${data.korisnik}</strong>
    <span style= "color: gray; font-size:0.8em">(${data.datum})</span>${data.tekst}<br/><hr/>`;
      komentarLista.appendChild(li);
    });
  });
