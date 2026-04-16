const endpoint = "https://formsubmit.co/paasilvac@gmail.com";

const linksPagamento = {
  "45-1": "LINK_45_1",
  "45-2": "LINK_45_2",
  "45-3": "LINK_45_3",
  "50-1": "https://mpago.la/2W8HoUn",
  "50-2": "LINK_50_2",
  "50-3": "LINK_50_3"
};

const selectedProductStorageKey = "selectedMugProduct";
const selectedQuantityStorageKey = "selectedMugQuantity";

let selectedProduct = loadSelectedProduct();
let selectedQuantity = loadSelectedQuantity();

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function isValidQuantity(quantity) {
  return [1, 2, 3].includes(quantity);
}

function getCartQuantity() {
  return selectedProduct ? selectedQuantity : 0;
}

function getCartTotal() {
  if (!selectedProduct) {
    return 0;
  }

  return selectedProduct.price * selectedQuantity;
}

function loadSelectedProduct() {
  try {
    const saved = localStorage.getItem(selectedProductStorageKey);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
}

function loadSelectedQuantity() {
  const saved = parseInt(localStorage.getItem(selectedQuantityStorageKey), 10);
  return isValidQuantity(saved) ? saved : 1;
}

function saveSelectedProduct(product) {
  selectedProduct = product;
  localStorage.setItem(selectedProductStorageKey, JSON.stringify(product));
  updateSelectedProductInfo();
}

function saveSelectedQuantity(quantity) {
  selectedQuantity = isValidQuantity(quantity) ? quantity : 1;
  localStorage.setItem(selectedQuantityStorageKey, String(selectedQuantity));
  updateSelectedProductInfo();
}

function clearSelectedProduct() {
  selectedProduct = null;
  selectedQuantity = 1;
  localStorage.removeItem(selectedProductStorageKey);
  localStorage.setItem(selectedQuantityStorageKey, "1");
  updateSelectedProductInfo();
}

function updateClearOrderButtons() {
  const clearOrderButton = document.getElementById("clearOrderButton");
  const clearCheckoutOrderButton = document.getElementById("clearCheckoutOrderButton");
  const shouldShow = Boolean(selectedProduct);

  [clearOrderButton, clearCheckoutOrderButton].forEach(button => {
    if (!button) {
      return;
    }

    button.classList.toggle("hidden", !shouldShow);
  });
}

function updateSelectedProductInfo() {
  const nameEl = document.getElementById("selectedProductName");
  const priceEl = document.getElementById("selectedProductPrice");
  const quantityEl = document.getElementById("selectedProductQuantity");
  const totalEl = document.getElementById("selectedProductTotal");
  const checkoutTotalEl = document.getElementById("checkoutTotal");

  if (!nameEl || !priceEl || !quantityEl || !totalEl || !checkoutTotalEl) {
    return;
  }

  if (!selectedProduct) {
    nameEl.textContent = "Produto selecionado: nenhum";
    priceEl.textContent = "Preço unitário: R$ 0";
    quantityEl.textContent = "Quantidade escolhida: 1 unidade";
    totalEl.textContent = "Total final: R$ 0";
    checkoutTotalEl.value = "R$ 0";
    updateClearOrderButtons();
    return;
  }

  const total = getCartTotal();
  nameEl.textContent = `Produto selecionado: ${selectedProduct.name}`;
  priceEl.textContent = `Preço unitário: ${formatCurrency(selectedProduct.price)}`;
  quantityEl.textContent = `Quantidade escolhida: ${selectedQuantity} ${selectedQuantity === 1 ? "unidade" : "unidades"}`;
  totalEl.textContent = `Total final: ${formatCurrency(total)}`;
  checkoutTotalEl.value = formatCurrency(total);
  updateClearOrderButtons();
}

function renderOrderSummary() {
  const summaryEl = document.getElementById("orderSummary");
  if (!summaryEl) {
    return;
  }

  if (!selectedProduct) {
    summaryEl.innerHTML = '<p class="cart-empty">Nenhum produto selecionado ainda. Escolha uma caneca para continuar.</p>';
    document.getElementById("total").innerText = "Total: R$ 0";
    updateClearOrderButtons();
    return;
  }

  const total = getCartTotal();
  summaryEl.innerHTML = `
    <p class="order-summary-title">${selectedProduct.name}</p>
    <p class="order-summary-line">Preço unitário: ${formatCurrency(selectedProduct.price)}</p>
    <p class="order-summary-line">Quantidade: ${selectedQuantity} ${selectedQuantity === 1 ? "unidade" : "unidades"}</p>
    <p class="order-summary-line">Total final: ${formatCurrency(total)}</p>
  `;
  document.getElementById("total").innerText = "Total: " + formatCurrency(total);
}

function clearOrder() {
  clearSelectedProduct();
  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();
  clearInvalidFields();
  setCheckoutMessage("Pedido removido. Escolha outra caneca para continuar.", "info");
  setCartMessage("Pedido removido com sucesso.", "info");

  const checkoutSection = document.getElementById("checkoutSection");
  if (checkoutSection) {
    checkoutSection.classList.add("hidden");
  }

  scrollToProducts();
}

function updateCartCount() {
  document.getElementById("cartCount").innerText = getCartQuantity();
}

function syncCheckoutQuantity() {
  const quantityInput = document.getElementById("quantity");
  const decreaseButton = document.getElementById("decreaseQuantityButton");
  const increaseButton = document.getElementById("increaseQuantityButton");

  if (!quantityInput) {
    return;
  }

  quantityInput.value = `${selectedQuantity} ${selectedQuantity === 1 ? "unidade" : "unidades"}`;

  if (decreaseButton) {
    decreaseButton.disabled = selectedQuantity <= 1;
  }

  if (increaseButton) {
    increaseButton.disabled = selectedQuantity >= 3;
  }
}

function decreaseQuantity() {
  if (selectedQuantity <= 1) {
    return;
  }

  saveSelectedQuantity(selectedQuantity - 1);
  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();
}

function increaseQuantity() {
  if (selectedQuantity >= 3) {
    return;
  }

  saveSelectedQuantity(selectedQuantity + 1);
  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();
}

function selectProduct(name, price) {
  saveSelectedProduct({ name, price });
  saveSelectedQuantity(1);
  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();
  setCartMessage("", "");
  setCheckoutMessage("Produto selecionado com sucesso. Agora escolha de 1 até 3 unidades e finalize seu pedido.", "info");
  openCheckout();
}

function openCart() {
  document.getElementById("cart").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openCheckout() {
  if (!selectedProduct) {
    setCartMessage("Escolha uma caneca antes de seguir para o checkout.", "error");
    scrollToProducts();
    return;
  }

  syncCheckoutQuantity();
  renderOrderSummary();
  setCartMessage("", "");
  const checkoutSection = document.getElementById("checkoutSection");
  checkoutSection.classList.remove("hidden");
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

  const quantityPicker = document.getElementById("quantityPicker");
  if (quantityPicker) {
    quantityPicker.classList.remove("invalid");
  }
}

function markInvalid(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add("invalid");
    if (typeof field.focus === "function") {
      field.focus();
    }
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

  if (!selectedProduct) {
    return "Escolha uma caneca antes de finalizar o pedido.";
  }

  if (!isValidQuantity(selectedQuantity)) {
    markInvalid("quantityPicker");
    return "Escolha uma quantidade válida: 1, 2 ou 3 unidades.";
  }

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

  return "";
}

// Gera um identificador simples e unico para o pedido sem backend.
function generateOrderCode() {
  return "CANECA-" + Date.now().toString().slice(-6);
}

function getPaymentKey() {
  return `${selectedProduct.price}-${selectedQuantity}`;
}

function buildOrderData(data, codigoPedido, total) {
  return {
    codigoPedido,
    produto: selectedProduct.name,
    precoUnitario: selectedProduct.price,
    quantidade: selectedQuantity,
    total,
    nomeCompleto: data.fullName,
    telefone: data.phone,
    endereco: data.address,
    numero: data.number,
    complemento: data.complement || "",
    observacoes: data.notes || ""
  };
}

async function sendOrder(orderData) {
  // Permite testar no GitHub Pages antes de configurar endpoint real.
  if (endpoint.includes("SEU-ENDPOINT-AQUI")) {
    return;
  }

  const formData = new FormData();

  for (let key in orderData) {
    formData.append(key, orderData[key]);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Falha ao enviar pedido");
  }
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();
  setCheckoutMessage("", "");

  const submitButton = document.getElementById("checkoutSubmit");
  const checkoutData = {
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    phoneDigits: document.getElementById("phone").value.replace(/\D/g, ""),
    address: document.getElementById("address").value.trim(),
    number: document.getElementById("number").value.trim(),
    complement: document.getElementById("complement").value.trim(),
    notes: document.getElementById("notes").value.trim()
  };

  const validationError = validateCheckoutForm(checkoutData);
  if (validationError) {
    setCheckoutMessage(validationError, "error");
    return;
  }

  const total = getCartTotal();
  const paymentLink = linksPagamento[getPaymentKey()];
  if (!paymentLink) {
    setCheckoutMessage("Ainda não temos link de pagamento para essa opção. Por favor, escolha outra quantidade.", "error");
    return;
  }

  const codigoPedido = generateOrderCode();
  const orderData = buildOrderData(checkoutData, codigoPedido, total);

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Enviando pedido...";
    setCheckoutMessage("Estamos enviando seu pedido. Aguarde alguns segundos.", "info");

    await sendOrder(orderData);

    setCheckoutMessage("Pedido enviado com sucesso. Você será redirecionado para o pagamento.", "success");
    setTimeout(() => {
      window.location.href = paymentLink;
    }, 1600);
  } catch (error) {
    setCheckoutMessage("Não foi possível enviar seu pedido agora. Verifique sua conexão e tente novamente.", "error");
    submitButton.disabled = false;
    submitButton.textContent = "Finalizar pedido";
  }
}

function handleQuantityChange() {
  syncCheckoutQuantity();
}

function initCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  if (!form) {
    return;
  }

  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", () => {
    phoneInput.value = maskPhone(phoneInput.value);
  });

  syncCheckoutQuantity();
  updateSelectedProductInfo();
  form.addEventListener("submit", handleCheckoutSubmit);
}

function scrollToProducts() {
  document.getElementById("produtos").scrollIntoView({ behavior: "smooth" });
}

renderOrderSummary();
updateSelectedProductInfo();
updateCartCount();
initCheckoutForm();