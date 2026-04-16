const numeroVendedor = "5511999999999";

let cart = [];

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCartQuantity() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function addToCart(name, price) {
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  renderCart();
  updateCartCount();
  syncCheckoutQuantity();
}

function openCart() {
  document.getElementById("cart").scrollIntoView({ behavior: "smooth", block: "start" });
}

function increaseQuantity(name) {
  const item = cart.find(cartItem => cartItem.name === name);
  if (item) {
    item.quantity += 1;
    renderCart();
    updateCartCount();
    syncCheckoutQuantity();
  }
}

function decreaseQuantity(name) {
  const item = cart.find(cartItem => cartItem.name === name);
  if (item) {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      cart = cart.filter(cartItem => cartItem.name !== name);
    }
    renderCart();
    updateCartCount();
    syncCheckoutQuantity();
  }
}

function renderCart() {
  const el = document.getElementById("cart");
  el.innerHTML = "";

  let total = 0;

  if (cart.length === 0) {
    el.innerHTML = '<p class="cart-empty">Seu carrinho está vazio. Adicione uma caneca para continuar.</p>';
    const checkoutSection = document.getElementById("checkoutSection");
    if (checkoutSection) {
      checkoutSection.classList.add("hidden");
    }
  } else {
    setCartMessage("", "");
  }

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    el.innerHTML += `
      <div class="cart-item">
        <div>
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-subtotal">Subtotal: ${formatCurrency(itemTotal)}</p>
        </div>
        <div class="qty-controls">
          <button onclick="decreaseQuantity('${item.name}')">-</button>
          <span>${item.quantity}</span>
          <button onclick="increaseQuantity('${item.name}')">+</button>
        </div>
      </div>
    `;
  });

  document.getElementById("total").innerText = "Total: " + formatCurrency(total);
}

function updateCartCount() {
  document.getElementById("cartCount").innerText = getCartQuantity();
}

function syncCheckoutQuantity() {
  const quantityInput = document.getElementById("quantity");
  if (!quantityInput) {
    return;
  }

  const quantity = Math.max(1, getCartQuantity());
  quantityInput.value = quantity;
  quantityInput.setAttribute("min", "1");
}

function openCheckout() {
  if (getCartQuantity() === 0) {
    setCartMessage("Adicione pelo menos uma caneca ao carrinho para finalizar a compra.", "error");
    openCart();
    return;
  }

  setCartMessage("", "");
  const checkoutSection = document.getElementById("checkoutSection");
  checkoutSection.classList.remove("hidden");
  if (!document.getElementById("quantity").value) {
    syncCheckoutQuantity();
  }
  setCheckoutMessage("", "");
  checkoutSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setCheckoutMessage(text, type) {
  const msgEl = document.getElementById("checkoutMessage");
  msgEl.className = "checkout-message";
  if (type) {
    msgEl.classList.add(type);
  }
  msgEl.textContent = text;
}

function setCartMessage(text, type) {
  const msgEl = document.getElementById("cartMessage");
  if (!msgEl) {
    return;
  }

  msgEl.className = "checkout-message";
  if (type) {
    msgEl.classList.add(type);
  }
  msgEl.textContent = text;
}

function clearInvalidFields() {
  document.querySelectorAll("#checkoutForm input, #checkoutForm textarea").forEach(field => {
    field.classList.remove("invalid");
  });
}

function markInvalid(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add("invalid");
    field.focus();
  }
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateCheckoutForm(data) {
  clearInvalidFields();

  if (!data.fullName) {
    markInvalid("fullName");
    return "Por favor, preencha seu nome completo.";
  }

  if (data.phoneDigits.length < 10) {
    markInvalid("phone");
    return "Por favor, informe um telefone com DDD.";
  }

  if (!data.address) {
    markInvalid("address");
    return "Por favor, preencha o endereço.";
  }

  if (!data.number) {
    markInvalid("number");
    return "Por favor, preencha o número do endereço.";
  }

  if (!Number.isInteger(data.quantity) || data.quantity < 1) {
    markInvalid("quantity");
    return "A quantidade deve ser no mínimo 1.";
  }

  return "";
}

// Gera um identificador simples e único para o pedido sem depender de backend.
function generateOrderCode() {
  return "CANECA-" + Date.now().toString().slice(-6);
}

function buildWhatsAppMessage(data, codigoPedido) {
  return `Olá! Gostaria de pedir uma caneca.\n\nCódigo do pedido: ${codigoPedido}\nNome: ${data.fullName}\nTelefone: ${data.phone}\nEndereço: ${data.address}, ${data.number}\nComplemento: ${data.complement || "Não informado"}\nQuantidade: ${data.quantity}\nObservações: ${data.notes || "Não informado"}`;
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  setCheckoutMessage("", "");

  const quantityValue = parseInt(document.getElementById("quantity").value, 10);

  const checkoutData = {
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    phoneDigits: document.getElementById("phone").value.replace(/\D/g, ""),
    address: document.getElementById("address").value.trim(),
    number: document.getElementById("number").value.trim(),
    complement: document.getElementById("complement").value.trim(),
    quantity: Number.isInteger(quantityValue) ? quantityValue : 0,
    notes: document.getElementById("notes").value.trim()
  };

  const validationError = validateCheckoutForm(checkoutData);
  if (validationError) {
    setCheckoutMessage(validationError, "error");
    return;
  }

  const codigoPedido = generateOrderCode();
  const message = buildWhatsAppMessage(checkoutData, codigoPedido);
  const encodedMessage = encodeURIComponent(message);
  setCheckoutMessage(`Código ${codigoPedido} gerado. Abrindo o WhatsApp...`, "success");
  window.open(`https://wa.me/${numeroVendedor}?text=${encodedMessage}`, "_blank");
}

function initCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  if (!form) {
    return;
  }

  const phoneInput = document.getElementById("phone");
  const quantityInput = document.getElementById("quantity");

  phoneInput.addEventListener("input", () => {
    phoneInput.value = maskPhone(phoneInput.value);
  });

  quantityInput.addEventListener("input", () => {
    const value = parseInt(quantityInput.value, 10);
    if (!Number.isInteger(value) || value < 1) {
      quantityInput.value = "1";
    }
  });

  if (!quantityInput.value) {
    quantityInput.value = String(Math.max(1, getCartQuantity()));
  }

  form.addEventListener("submit", handleCheckoutSubmit);
}

function scrollToProducts() {
  document.getElementById("produtos").scrollIntoView({ behavior: "smooth" });
}

renderCart();
updateCartCount();
initCheckoutForm();