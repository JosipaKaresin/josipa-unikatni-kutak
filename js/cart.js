console.log("CART.JS SE LOADA!");

// -----------------------------------
// FIREBASE
// -----------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyA2aRuGIW3jQjCqnd6hcWAk8TXsS7wmJm4",
  authDomain: "unikatni-kutak-jk-394e6.firebaseapp.com",
  projectId: "unikatni-kutak-jk-394e6",
  storageBucket: "unikatni-kutak-jk-394e6.firebasestorage.app",
  messagingSenderId: "642454571103",
  appId: "1:642454571103:web:2b8937f1b2ebf394f473ea",
  measurementId: "G-4BWKK0EN4W",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// -----------------------------------
// LOCALSTORAGE
// -----------------------------------
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// -----------------------------------
// KOŠARICA UPDATE BUBBLE
// -----------------------------------
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.kolicina, 0);
  document.getElementById("cart-count").textContent = count;
}

// -----------------------------------
// RENDER KOŠARICE
// -----------------------------------
function renderCart() {
  const cart = getCart();

  const list = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  const qtyBox = document.getElementById("cart-items-total");

  list.innerHTML = "";

  let total = 0;
  let totalQty = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
        <strong>-- ${item.name} --</strong><br>
        Visina: ${item.visina}<br>
        Boja: ${item.boja}<br>
        Dodatak: ${item.dodatak}<br>

        <div class="qty-row">
            <button class="qty-btn minus" data-index="${index}">−</button>
            <span class="qty-number">${item.kolicina}</span>
            <button class="qty-btn plus" data-index="${index}">+</button>
        </div>

        <strong>Cijena: ${(item.price * item.kolicina).toFixed(
          2
        )} €</strong><br>
        <button class="remove-item" data-index="${index}">Obriši</button>
        <hr>
        `;

    list.appendChild(li);

    total += item.price * item.kolicina;
    totalQty += item.kolicina;
  });

  totalBox.textContent = total.toFixed(2) + " €";
  qtyBox.textContent = totalQty;

  // event — brisanje
  document.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      cart.splice(btn.dataset.index, 1);
      saveCart(cart);
      renderCart();
      updateCartCount();
    });
  });

  // event — plus
  document.querySelectorAll(".qty-btn.plus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      cart[btn.dataset.index].kolicina++;
      saveCart(cart);
      renderCart();
      updateCartCount();
    });
  });

  // event — minus
  document.querySelectorAll(".qty-btn.minus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      cart[btn.dataset.index].kolicina--;
      if (cart[btn.dataset.index].kolicina < 1)
        cart[btn.dataset.index].kolicina = 1;
      saveCart(cart);
      renderCart();
      updateCartCount();
    });
  });
}

// -----------------------------------
// MODAL ELEMENTI
// -----------------------------------
let currentCard = null;

const modal = document.getElementById("orderModal");
const modalImg = document.getElementById("modal-product-image");
const modalName = document.getElementById("modal-product-name");

const selectVisina = document.getElementById("select-visina");
const selectBoja = document.getElementById("select-boja");
const selectDodatak = document.getElementById("select-dodatak");

const priceBox = document.getElementById("modal-price");
const qtyNumber = document.getElementById("qty-number");

// -----------------------------------
// FUNKCIJE ZA MODAL
// -----------------------------------
function fillSelect(select, string) {
  select.innerHTML = "";
  string.split(",").forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

function updateModalPrice() {
  if (!currentCard) return;
  let optionValue = selectVisina.value;
  let cleaned = optionValue.replace(/[a-zA-Z]/g, "");
  // dataset pretvara "-" u "_" + točka mora biti "_"
  let datasetKey = "price_" + cleaned.replace(".", "_");

  const doplata = selectDodatak.value === "bez" ? 0 : 5;

  const basePrice = Number(currentCard.dataset[datasetKey]) || 0;

  priceBox.textContent = `Cijena: ${(basePrice + doplata).toFixed(2)} €`;
}

// -----------------------------------
// EVENT: OTVORI MODAL (IZ CARD)
// -----------------------------------
document.querySelectorAll(".card .button").forEach((btn) => {
  btn.addEventListener("click", function () {
    currentCard = this.closest(".card");

    modalImg.src = currentCard.querySelector("img").src;
    modalName.textContent = currentCard.dataset.name;

    fillSelect(selectVisina, currentCard.dataset.visine);
    fillSelect(selectBoja, currentCard.dataset.boje);
    fillSelect(selectDodatak, currentCard.dataset.dodaci);

    qtyNumber.textContent = 1;

    updateModalPrice();

    modal.classList.add("show");
  });
});

document.querySelector(".close-modal").addEventListener("click", () => {
  modal.classList.remove("show");
});

// -----------------------------------
// EVENT: PLUS / MINUS
// -----------------------------------
document.getElementById("qty-plus").addEventListener("click", () => {
  qtyNumber.textContent = Number(qtyNumber.textContent) + 1;
});

document.getElementById("qty-minus").addEventListener("click", () => {
  if (Number(qtyNumber.textContent) > 1)
    qtyNumber.textContent = Number(qtyNumber.textContent) - 1;
});

selectVisina.addEventListener("change", updateModalPrice);
selectDodatak.addEventListener("change", updateModalPrice);

// -----------------------------------
// EVENT: NARUČI → košarica
// -----------------------------------
document.getElementById("modal-order-btn").addEventListener("click", () => {
  if (!currentCard) return;

  // npr. "50cm" ili "0.03l"
  const optionValue = selectVisina.value;

  // makni sva slova → "50" ili "0.03"
  const cleaned = optionValue.replace(/[a-zA-Z]/g, "");

  // dataset ključ: "price_50" ili "price_0_03"
  const datasetKey = "price_" + cleaned.replace(".", "_");

  // doplata za dodatak (5 € ako nije "bez")
  const doplata = selectDodatak.value === "bez" ? 0 : 5;

  // osnovna cijena iz data atributa na .card
  const basePrice = Number(currentCard.dataset[datasetKey]) || 0;

  const finalPrice = basePrice + doplata;

  const product = {
    name: modalName.textContent,
    image: modalImg.src,
    visina: selectVisina.value,
    boja: selectBoja ? selectBoja.value : "",
    dodatak: selectDodatak.value,
    kolicina: Number(qtyNumber.textContent),
    price: finalPrice,
  };

  const cart = getCart();
  cart.push(product);
  saveCart(cart);

  renderCart();
  updateCartCount();

  modal.classList.remove("show");
});

// -----------------------------------
// SIDEBAR KOŠARICA
// -----------------------------------
document.getElementById("cart-toggle").addEventListener("click", () => {
  document.getElementById("cart-sidebar").classList.add("open");
  renderCart();
});

document.getElementById("cart-close").addEventListener("click", () => {
  document.getElementById("cart-sidebar").classList.remove("open");
});

document.getElementById("checkout-btn").addEventListener("click", () => {
  document.getElementById("checkout-panel").classList.add("show");
});

// -----------------------------------
// FIRESTORE: slanje narudžbe
// -----------------------------------
document.getElementById("submit-order").addEventListener("click", async () => {
  const cart = getCart();

  const requiredFields = document.querySelectorAll(
    "#cust-name, #cust-email, #cust-phone, #cust-address, #cust-city"
  );

  for (let field of requiredFields) {
    if (!field.value.trim()) {
      document.getElementById("order-message").textContent =
        "Molimo ispunite sva polja!";
      return;
    }
  }

  if (cart.length === 0) {
    alert("Košarica je prazna!");
    return;
  }

  const order = {
    items: cart,
    total: cart.reduce((s, item) => s + item.price * item.kolicina, 0),
    qty: cart.reduce((s, item) => s + item.kolicina, 0),

    name: document.getElementById("cust-name").value,
    email: document.getElementById("cust-email").value,
    phone: document.getElementById("cust-phone").value,
    address: document.getElementById("cust-address").value,
    city: document.getElementById("cust-city").value,
    delivery: document.getElementById("cust-delivery").value,
    payment: document.getElementById("cust-payment").value,

    createdAt: new Date(),
  };

  await db.collection("orders").add(order);

  // isprazni sve
  localStorage.removeItem("cart");
  renderCart();
  updateCartCount();

  // isprazni formu
  document.getElementById("cust-name").value = "";
  document.getElementById("cust-email").value = "";
  document.getElementById("cust-phone").value = "";
  document.getElementById("cust-address").value = "";
  document.getElementById("cust-city").value = "";

  document.getElementById("order-message").textContent =
    "Narudžba uspješno poslana!";

  setTimeout(() => {
    document.getElementById("order-message").textContent = "";
    document.getElementById("checkout-panel").classList.remove("show");

    // 3. Po želji resetiraj polja forme
    document.getElementById("cust-name").value = "";
    document.getElementById("cust-email").value = "";
    document.getElementById("cust-phone").value = "";
    document.getElementById("cust-address").value = "";
    document.getElementById("cust-city").value = "";
    document.getElementById("cust-delivery").value = "GLS";
    document.getElementById("cust-payment").value = "Pouzeće";
  }, 4000);
});

// -----------------------------------
// POČETNO UČITAVANJE
// -----------------------------------
updateCartCount();
renderCart();
