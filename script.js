let cart = [];

function addToCart(name, price) {
  let existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({name, price, quantity: 1});
  }
  renderCart();
  updateCartCount();
}

function openCart() {
  document.getElementById("cart").scrollIntoView({behavior: "smooth", block: "start"});
}

function increaseQuantity(name) {
  let item = cart.find(item => item.name === name);
  if (item) {
    item.quantity += 1;
    renderCart();
    updateCartCount();
  }
}

function decreaseQuantity(name) {
  let item = cart.find(item => item.name === name);
  if (item) {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      cart = cart.filter(cartItem => cartItem.name !== name);
    }
    renderCart();
    updateCartCount();
  }
}

function renderCart() {
  let el = document.getElementById("cart");
  el.innerHTML = "";

  let total = 0;

  if (cart.length === 0) {
    el.innerHTML = `<p class="cart-empty">Seu carrinho está vazio. Adicione uma caneca para continuar.</p>`;
  }

  cart.forEach(item => {
    let itemTotal = item.price * item.quantity;
    total += itemTotal;
    el.innerHTML += `
      <div class="cart-item">
        <div>
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-subtotal">Subtotal: R$ ${itemTotal}</p>
        </div>
        <div class="qty-controls">
          <button onclick="decreaseQuantity('${item.name}')">-</button>
          <span>${item.quantity}</span>
          <button onclick="increaseQuantity('${item.name}')">+</button>
        </div>
      </div>
    `;
  });

  document.getElementById("total").innerText =
    "Total: R$ " + total;
}

function updateCartCount() {
  let count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").innerText = count;
}

function openCheckout() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  // Limpar os campos do formulário
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  window.scrollTo({top: 0, behavior: "smooth"});
}

function sendWhats() {

  let nome = document.getElementById("name").value.trim();
  let phone = document.getElementById("phone").value.trim();

  // Validação dos campos obrigatórios
  if (!nome) {
    alert("Por favor, digite seu nome.");
    document.getElementById("name").focus();
    return;
  }

  if (!phone) {
    alert("Por favor, digite seu WhatsApp.");
    document.getElementById("phone").focus();
    return;
  }

  // Validação básica do telefone (pelo menos 10 dígitos)
  let phoneNumbersOnly = phone.replace(/\D/g, '');
  if (phoneNumbersOnly.length < 10) {
    alert("Por favor, digite um número de WhatsApp válido (mínimo 10 dígitos).");
    document.getElementById("phone").focus();
    return;
  }

  let msg = "Novo Pedido:%0A";

  cart.forEach(item => {
    msg += `${item.quantity}x ${item.name} - R$ ${item.price} cada (Total: R$ ${item.price * item.quantity})%0A`;
  });

  msg += "%0ANome do Cliente: " + nome;
  msg += "%0AWhatsApp do Cliente: " + phone;

  // Enviar para o número do negócio
  window.open(`https://wa.me/5511988872916?text=${msg}`);
}

function scrollToProducts() {
  document.getElementById("produtos")
    .scrollIntoView({behavior:"smooth"});
}