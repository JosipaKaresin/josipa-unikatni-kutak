// LOCALSTORAGE
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || []; //java string u objekt
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// KOŠARICA UPDATE BROJAČA
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.kolicina, 0);
  document.getElementById("cart-count").textContent = count;
}

// RENDER KOŠARICE
function renderCart() {
  const cart = getCart();

  const list = document.getElementById("cart-items");
  const totalBox = document.getElementById("cart-total");
  const qtyBox = document.getElementById("cart-items-total");

  if (!list || !totalBox || !qtyBox) return;

  list.innerHTML = ""; //briše staro da se ne dupla

  let total = 0; //početno
  let totalQty = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");

    li.innerHTML = `<div class="cart-raspored">
      <div class="cart-left"><strong>*${item.name}</strong><br>
       <img src="${item.slika || item.image || ""}" alt="${
      item.name
    }" class="cart-img"></div>
    <div class="cart-right">
        Visina: ${item.visina}<br>
        Boja: ${item.boja}<br>
        Dodatak: ${item.dodatak}<br>

        <div class="qty-row">
            <button class="qty-btn minus" data-index="${index}">-</button>
            <span class="qty-number">${item.kolicina}</span>
            <button class="qty-btn plus" data-index="${index}">+</button>
        </div>

        <strong>Cijena: ${(item.price * item.kolicina).toFixed(
          2
        )} €</strong><br>
        <button class="remove-item" data-index="${index}">Obriši</button>
        </div>
        </div>
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
      cart.splice(btn.dataset.index, 1); //briše 1 element na nizu
      if (!confirm("Jeste li sigurni da želite obrisati proizvod?"))
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
        //ne dopušta ispo 1
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

if (modal) {
  const modalImg = document.getElementById("modal-product-image");
  const modalName = document.getElementById("modal-product-name");

  const selectVisina = document.getElementById("select-visina");
  const selectBoja = document.getElementById("select-boja");
  const selectDodatak = document.getElementById("select-dodatak");

  const priceBox = document.getElementById("modal-price");
  const qtyNumber = document.getElementById("qty-number");

  ///popunjava select iz stringa
  function fillSelect(select, string) {
    if (!select) return;
    select.innerHTML = "";
    string.split(",").forEach((v) => {
      const o = document.createElement("option"); //kreiran option
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

    const doplata = selectDodatak.value === "bez" ? 0 : 5; //+ 5€ ako nije bez

    const basePrice = Number(currentCard.dataset[datasetKey]) || 0;

    priceBox.textContent = `Cijena: ${(basePrice + doplata).toFixed(2)} €`;
  }

  // -----------------------------------
  // OTVORI MODAL (IZ CARD)
  // -----------------------------------
  document.querySelectorAll(".card .button").forEach((btn) => {
    btn.addEventListener("click", function () {
      currentCard = this.closest(".card");
      if (!currentCard) return;

      modalImg.src = currentCard.querySelector("img").src;
      modalName.textContent = currentCard.dataset.name;

      fillSelect(selectVisina, currentCard.dataset.visine);
      fillSelect(selectBoja, currentCard.dataset.boje);
      fillSelect(selectDodatak, currentCard.dataset.dodaci);

      qtyNumber.textContent = 1;

      updateModalPrice();

      modal.classList.add("show"); //dodavanja klase show da se modal prikaže
    });
  });

  document.querySelector(".close-modal").addEventListener("click", () => {
    modal.classList.remove("show");
  });

  // EVENT: PLUS / MINUS

  document.getElementById("qty-plus").addEventListener("click", () => {
    qtyNumber.textContent = Number(qtyNumber.textContent) + 1; //čita broj iz spana
  });

  document.getElementById("qty-minus").addEventListener("click", () => {
    if (Number(qtyNumber.textContent) > 1)
      qtyNumber.textContent = Number(qtyNumber.textContent) - 1;
  });

  selectVisina.addEventListener("change", updateModalPrice);
  selectDodatak.addEventListener("change", updateModalPrice);

  // -----------------------------------
  // EVENT: NARUČI - košarica
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
      slika: modalImg.src,
      visina: selectVisina.value,
      boja: selectBoja ? selectBoja.value : "",
      dodatak: selectDodatak.value,
      kolicina: Number(qtyNumber.textContent),
      price: finalPrice,
    };

    const cart = getCart();
    cart.push(product);
    saveCart(cart); //spreme lokalno

    Swal.fire({
      icon: "success",
      title: "Proizvod je dodan u košaricu!",
      showConfirmButton: false,
      timer: 2000,
    });

    renderCart();
    updateCartCount();

    modal.classList.remove("show");
  });
}
// -----------------------------------
// SIDEBAR KOŠARICA
// -----------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const cartToggle = document.getElementById("cart-toggle");
  const cartSidebar = document.getElementById("cart-sidebar");
  const cartClose = document.getElementById("cart-close");
  const checkoutBtn = document.getElementById("checkout-btn");
  const checkoutPanel = document.getElementById("checkout-panel");

  updateCartCount();
  renderCart();

  if (cartToggle && cartSidebar) {
    cartToggle.addEventListener("click", (e) => {
      e.preventDefault();

      document.querySelectorAll(".dropdown.open").forEach((d) => {
        d.classList.remove("open");
      });
      cartSidebar.classList.add("open");
      renderCart();
    });
  }

  if (cartClose && cartSidebar) {
    cartClose.addEventListener("click", (e) => {
      e.preventDefault();

      cartSidebar.classList.remove("open");
    });
  }

  if (checkoutBtn && checkoutPanel) {
    checkoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      checkoutPanel.classList.add("show");
    });
  }
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

    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: "novo",
  }; //da admin može pratiti

  await window.fs.collection("orders").add(order);

  // isprazni sve
  localStorage.removeItem("cart");
  renderCart();
  updateCartCount();

  // pražnjenje forme
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

    // resetiranje polja forme
    document.getElementById("cust-name").value = "";
    document.getElementById("cust-email").value = "";
    document.getElementById("cust-phone").value = "";
    document.getElementById("cust-address").value = "";
    document.getElementById("cust-city").value = "";
    document.getElementById("cust-delivery").value = "GLS";
    document.getElementById("cust-payment").value = "Pouzeće";
  }, 4000);
});
