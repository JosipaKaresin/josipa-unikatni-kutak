//-----------------------------------------------
//Dropdown i karta
//-----------------------------------------------
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
        //karta s popup adresom
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
//close(x)
function closeDropdown(closeBtn) {
  const subnav = closeBtn.closest(".dropdown");
  subnav.classList.remove("open");
}

//-----------------------------------------------
//DATUM I VRIJEME
//-----------------------------------------------
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

//-----------------------------------------------
//prijava i registracija
//-----------------------------------------------
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

//inicijalizacija- zbog više inicijalizacija da se ne preklapaju
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

//spaja stranicu na firebase
const auth = firebase.auth();
const db = firebase.database();

const authSection = document.getElementById("auth");
const appSection = document.getElementById("app");
const dobrodosli = document.getElementById("dobrodosli");

let currentUser;

//helper funkcije
function emailInput() {
  return document.getElementById("email").value.trim();
}

function passwordInput() {
  return document.getElementById("password").value.trim();
}

function passwordConfirmInput() {
  return document.getElementById("passwordConfirm").value.trim();
}

document.getElementById("btnRegister").addEventListener("click", async () => {
  const passwordConfirmField = document.getElementById("passwordConfirm");

  if (getComputedStyle(passwordConfirmField).display === "none") {
    passwordConfirmField.style.display = "block";
    passwordConfirmField.focus();
    return;
  }

  const email = emailInput();
  const password = passwordInput();
  const passwordConfirm = passwordConfirmInput();

  if (!email || !password || !passwordConfirm) {
    alert("Molimo popunite sva polja");
    return;
  }

  if (password !== passwordConfirm) {
    alert("Lozinke se ne podudaraju");
    return;
  }

  if (password.length < 6) {
    alert("Lozinka mora imati najmanje 6 znakova");
    return;
  }

  //firebase napravi račun
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );

    const uid = userCredential.user.uid;
    currentUser = userCredential.user;

    //DODAVANJE KORISNIKA U REALTIME DATABASE
    await db.ref(`Korisnik/${uid}`).set({
      Email: email,
      Id: uid,
      UserName: email.split("@")[0],
    });

    dobrodosli.textContent = `Dobrodosli ${currentUser.email}`;
    alert("Registracija uspješna");

    passwordConfirmField.style.display = "none";
    passwordConfirmField.value = "";
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

//admin provjera

const adminLink = document.getElementById("admin-link");
const userPanel = document.getElementById("userPanel");

auth.onAuthStateChanged(async (user) => {
  // default: sve sakrij
  if (userPanel) userPanel.style.display = "none";
  if (adminLink) adminLink.style.display = "none";
  if (appSection) appSection.style.display = "none";
  if (authSection) authSection.style.display = "block"; // login forma

  //reset forme
  if (!user) {
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");

    if (emailEl) emailEl.value = "";
    if (passEl) passEl.value = "";
    if (dobrodosli) dobrodosli.textContent = "Dobrodošli!";

    return;
  }

  // prijavljen -> sakrij login formu, pokaži app + user panel
  if (authSection) authSection.style.display = "none";
  if (appSection) appSection.style.display = "block";
  if (userPanel) userPanel.style.display = "block";

  if (dobrodosli) dobrodosli.textContent = `Dobrodošli ${user.email}`;

  try {
    const doc = await firebase
      .firestore()
      .collection("admins")
      .doc(user.uid)
      .get();
    const isAdmin = doc.exists && doc.data()?.role === "admin";

    if (isAdmin && adminLink) adminLink.style.display = "inline-block";
  } catch (e) {
    console.error("Admin provjera greška:", e);
  }
});

//-----------------------------------------------
//KOMENTARI
//-----------------------------------------------
const komentarForm = document.getElementById("komentarForm");
const komentarInput = document.getElementById("komentarInput");
const komentarLista = document.getElementById("komentarLista");

komentarForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const tekst = komentarInput.value.trim();
  if (tekst === "") return;

  const user = firebase.auth().currentUser;
  const userName = user ? user.email : "Anonimni korisnik";

  //spremanje komentara u firebase db
  const newKomentarRef = db.ref("komentari").push();
  newKomentarRef.set({
    tekst: tekst,
    korisnik: userName,
    datum: new Date().toLocaleString(),
  });

  //reset inputa
  komentarInput.value = "";
});

db.ref("komentari").on("value", (snapshot) => {
  komentarLista.innerHTML = ""; //brisanje stare liste da se ne dodaju duplikati
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    const li = document.createElement("li");
    li.innerHTML = `<strong>${data.korisnik}</strong>
    <span style= "color: gray; font-size:0.8em">(${data.datum})</span>${data.tekst}<br/><hr/>`;
    komentarLista.appendChild(li);
  });
});
