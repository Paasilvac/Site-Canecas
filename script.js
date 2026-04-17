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
const cartItemsStorageKey = "selectedMugCartItems";

let selectedProduct = loadSelectedProduct();
let selectedQuantity = loadSelectedQuantity();
let cartItems = loadCartItems();

if (!selectedProduct && cartItems.length > 0) {
  const lastItem = cartItems[cartItems.length - 1];
  selectedProduct = { name: lastItem.name, price: lastItem.price };
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1;
}

function getCartQuantity() {
  return cartItems.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCheckoutTotal() {
  if (cartItems.length === 0) {
    return 0;
  }

  return getCartTotal();
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

function loadCartItems() {
  try {
    const saved = localStorage.getItem(cartItemsStorageKey);
    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(item => ({
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      }))
      .filter(item => item.name && Number.isFinite(item.price) && Number.isFinite(item.quantity) && item.quantity > 0);
  } catch (error) {
    return [];
  }
}

function saveCartItems() {
  localStorage.setItem(cartItemsStorageKey, JSON.stringify(cartItems));
}

function addToCart(name, price) {
  const existing = cartItems.find(item => item.name === name && item.price === price);

  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({ name, price, quantity: 1 });
  }

  saveCartItems();

  const updatedItem = cartItems.find(item => item.name === name && item.price === price);
  return {
    added: true,
    quantity: updatedItem ? updatedItem.quantity : 1
  };
}

function getSelectedCartItem() {
  if (!selectedProduct) {
    return null;
  }

  return cartItems.find(item => item.name === selectedProduct.name && item.price === selectedProduct.price) || null;
}

function updateSelectedProductQuantity(quantity) {
  const nextQuantity = parseInt(quantity, 10);
  if (!isValidQuantity(nextQuantity)) {
    return false;
  }

  const selectedItem = getSelectedCartItem();
  if (!selectedItem) {
    return false;
  }

  selectedItem.quantity = nextQuantity;
  saveCartItems();
  saveSelectedQuantity(nextQuantity);
  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();
  return true;
}

function hasProductInCart(product) {
  if (!product) {
    return false;
  }

  return cartItems.some(item => item.name === product.name && item.price === product.price);
}

function syncAfterCartChange() {
  if (!hasProductInCart(selectedProduct)) {
    if (cartItems.length > 0) {
      const lastItem = cartItems[cartItems.length - 1];
      saveSelectedProduct({ name: lastItem.name, price: lastItem.price });
      saveSelectedQuantity(lastItem.quantity);
    } else {
      selectedProduct = null;
      selectedQuantity = 1;
      localStorage.removeItem(selectedProductStorageKey);
      localStorage.setItem(selectedQuantityStorageKey, "1");
      updateSelectedProductInfo();
    }
  }

  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();

  if (cartItems.length === 0) {
    setCheckoutMessage("Seu carrinho ficou vazio. Escolha uma caneca para continuar.", "info");
    const checkoutSection = document.getElementById("checkoutSection");
    if (checkoutSection) {
      checkoutSection.classList.add("hidden");
    }
    return;
  }

  setCheckoutMessage("Carrinho atualizado com sucesso.", "info");
}

function updateCartItemQuantity(index, rawValue) {
  if (index < 0 || index >= cartItems.length) {
    return;
  }

  const nextQuantity = parseInt(rawValue, 10);
  if (!isValidQuantity(nextQuantity)) {
    setCartMessage("Digite uma quantidade válida (mínimo 1).", "error");
    renderOrderSummary();
    syncCheckoutQuantity();
    return;
  }

  cartItems[index].quantity = nextQuantity;

  saveCartItems();

  if (selectedProduct && cartItems[index].name === selectedProduct.name && cartItems[index].price === selectedProduct.price) {
    saveSelectedQuantity(nextQuantity);
  }

  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();
  setCartMessage("Quantidade atualizada no carrinho.", "info");
}

function removeCartItem(index) {
  if (index < 0 || index >= cartItems.length) {
    return;
  }

  cartItems.splice(index, 1);
  saveCartItems();
  setCartMessage("Produto removido do carrinho.", "info");
  syncAfterCartChange();
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
  cartItems = [];
  localStorage.removeItem(selectedProductStorageKey);
  localStorage.setItem(selectedQuantityStorageKey, "1");
  localStorage.removeItem(cartItemsStorageKey);
  updateSelectedProductInfo();
}

function updateClearOrderButtons() {
  const clearOrderButton = document.getElementById("clearOrderButton");
  const clearCheckoutOrderButton = document.getElementById("clearCheckoutOrderButton");
  const shouldShow = cartItems.length > 0;

  [clearOrderButton, clearCheckoutOrderButton].forEach(button => {
    if (!button) {
      return;
    }

    button.classList.toggle("hidden", !shouldShow);
  });
}

function updateSelectedProductInfo() {
  const nameEl = document.getElementById("selectedProductName");
  const listEl = document.getElementById("selectedProductsList");
  const quantityEl = document.getElementById("selectedProductQuantity");
  const totalEl = document.getElementById("selectedProductTotal");
  const checkoutTotalEl = document.getElementById("checkoutTotal");

  if (!nameEl || !listEl || !quantityEl || !totalEl || !checkoutTotalEl) {
    return;
  }

  if (cartItems.length === 0) {
    nameEl.textContent = "Produtos selecionados: nenhum";
    listEl.innerHTML = "<li>Nenhum item no carrinho.</li>";
    quantityEl.textContent = "Quantidade total: 0 unidades";
    totalEl.textContent = "Total final: R$ 0";
    checkoutTotalEl.value = "R$ 0";
    updateClearOrderButtons();
    return;
  }

  nameEl.textContent = "Produtos selecionados:";
  listEl.innerHTML = cartItems
    .map(item => `<li>${item.name} - ${item.quantity} ${item.quantity === 1 ? "unidade" : "unidades"} (${formatCurrency(item.price * item.quantity)})</li>`)
    .join("");

  const totalItems = getCartQuantity();
  const total = getCheckoutTotal();
  quantityEl.textContent = `Quantidade total: ${totalItems} ${totalItems === 1 ? "unidade" : "unidades"}`;
  totalEl.textContent = `Total final: ${formatCurrency(total)}`;
  checkoutTotalEl.value = formatCurrency(total);
  updateClearOrderButtons();
}

function renderOrderSummary() {
  const summaryEl = document.getElementById("orderSummary");
  if (!summaryEl) {
    return;
  }

  if (cartItems.length === 0) {
    summaryEl.innerHTML = '<p class="cart-empty">Nenhum produto no carrinho ainda. Escolha uma caneca para continuar.</p>';
    document.getElementById("total").innerText = "Total: R$ 0";
    updateClearOrderButtons();
    return;
  }

  const listHtml = cartItems
    .map((item, index) => `
      <li class="order-summary-item">
        <span>${item.name}</span>
        <span>${formatCurrency(item.price * item.quantity)}</span>
        <span class="order-item-actions">
          <input type="number" min="1" step="1" class="order-quantity-input" value="${item.quantity}" onchange="updateCartItemQuantity(${index}, this.value)" aria-label="Quantidade de ${item.name}">
          <button type="button" class="order-remove-button danger" onclick="removeCartItem(${index})">Excluir</button>
        </span>
      </li>
    `)
    .join("");

  const total = getCartTotal();
  summaryEl.innerHTML = `
    <p class="order-summary-title">Produtos escolhidos</p>
    <ul class="order-summary-list">${listHtml}</ul>
  `;
  document.getElementById("total").innerText = "Total: " + formatCurrency(total);
}

function clearOrder() {
  clearSelectedProduct();
  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();
  clearInvalidFields();
  setCheckoutMessage("Carrinho removido. Escolha outra caneca para continuar.", "info");
  setCartMessage("Carrinho removido com sucesso.", "info");

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

  if (!quantityInput) {
    return;
  }

  const totalItems = getCartQuantity();
  quantityInput.value = `${totalItems} ${totalItems === 1 ? "unidade" : "unidades"}`;
}

function selectProduct(name, price) {
  const cartUpdate = addToCart(name, price);
  saveSelectedProduct({ name, price });
  saveSelectedQuantity(cartUpdate.quantity);
  renderOrderSummary();
  updateCartCount();
  syncCheckoutQuantity();

  setCartMessage("", "");
  setCheckoutMessage("Produto adicionado ao carrinho com sucesso. Ajuste a quantidade e finalize seu carrinho.", "info");

  openCheckout();
}

function openCart() {
  document.getElementById("cart").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openCheckout() {
  if (cartItems.length === 0) {
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

  if (cartItems.length === 0) {
    return "Escolha uma caneca antes de finalizar o carrinho.";
  }

  if (!isValidQuantity(getCartQuantity())) {
    markInvalid("quantity");
    return "Escolha uma quantidade válida (mínimo de 1 unidade).";
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

// Gera um identificador simples e unico para o carrinho sem backend.
function generateOrderCode() {
  return "CANECA-" + Date.now().toString().slice(-6);
}

function getPaymentKey() {
  if (cartItems.length !== 1) {
    return "";
  }

  const item = cartItems[0];
  return `${item.price}-${item.quantity}`;
}

function buildOrderData(data, codigoCarrinho, total) {
  const itemsDescription = cartItems
    .map(item => `${item.name} (${item.quantity}x) - ${formatCurrency(item.price * item.quantity)}`)
    .join(" | ");

  return {
    codigoCarrinho,
    produto: cartItems.length === 1 ? cartItems[0].name : "Carrinho com múltiplos produtos",
    precoUnitario: cartItems.length === 1 ? cartItems[0].price : "Vários",
    quantidade: getCartQuantity(),
    itensCarrinho: itemsDescription,
    total,
    nomeCompleto: data.fullName,
    telefone: data.phone,
    endereco: data.address,
    numero: data.number,
    complemento: data.complement || "",
    observacoes: data.notes || ""
  };
}

function getCheckoutItemsSummaryText() {
  if (cartItems.length === 0) {
    return "";
  }

  return cartItems
    .map(item => `${item.name} (${item.quantity}x)`)
    .join(" | ");
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
    throw new Error("Falha ao enviar carrinho");
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

  const total = getCheckoutTotal();
  const paymentLink = linksPagamento[getPaymentKey()];

  const codigoCarrinho = generateOrderCode();
  const orderData = buildOrderData(checkoutData, codigoCarrinho, total);

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Enviando carrinho...";
    setCheckoutMessage("Estamos enviando seu carrinho. Aguarde alguns segundos.", "info");

    await sendOrder(orderData);

    const itemsSummary = getCheckoutItemsSummaryText();

    if (paymentLink) {
      setCheckoutMessage(`Carrinho enviado com sucesso. Itens: ${itemsSummary}. Você será redirecionado para o pagamento.`, "success");
      setTimeout(() => {
        window.location.href = paymentLink;
      }, 2200);
    } else {
      setCheckoutMessage(`Carrinho enviado com sucesso. Itens: ${itemsSummary}. Entraremos em contato para finalizar o pagamento.`, "success");
      submitButton.disabled = false;
      submitButton.textContent = "Finalizar carrinho";
    }
  } catch (error) {
    setCheckoutMessage("Não foi possível enviar seu carrinho agora. Verifique sua conexão e tente novamente.", "error");
    submitButton.disabled = false;
    submitButton.textContent = "Finalizar carrinho";
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