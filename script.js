const defaultProducts = [
  {
    id: 1,
    name: "Fresh Milk 1L",
    category: "Dairy",
    barcode: "8901234567001",
    price: 56,
    quantity: 32,
    reorder: 10
  },
  {
    id: 2,
    name: "Basmati Rice 5kg",
    category: "Grocery",
    barcode: "8901234567002",
    price: 620,
    quantity: 18,
    reorder: 8
  },
  {
    id: 3,
    name: "Sunflower Oil 1L",
    category: "Grocery",
    barcode: "8901234567003",
    price: 145,
    quantity: 9,
    reorder: 10
  },
  {
    id: 4,
    name: "Brown Bread",
    category: "Bakery",
    barcode: "8901234567004",
    price: 38,
    quantity: 22,
    reorder: 6
  },
  {
    id: 5,
    name: "Salted Chips",
    category: "Snacks",
    barcode: "8901234567005",
    price: 20,
    quantity: 14,
    reorder: 5
  },
  {
    id: 6,
    name: "Bath Soap",
    category: "Personal Care",
    barcode: "8901234567006",
    price: 42,
    quantity: 7,
    reorder: 8
  }
];

const productsKey = "happy-mart-products";
const cartKey = "happy-mart-cart";
const scanKey = "happy-mart-scan-history";
const purchaseBillsKey = "happy-mart-purchase-bills";

function getProducts() {
  const stored = localStorage.getItem(productsKey);
  if (!stored) {
    localStorage.setItem(productsKey, JSON.stringify(defaultProducts));
    return [...defaultProducts];
  }
  return JSON.parse(stored);
}

function saveProducts(products) {
  localStorage.setItem(productsKey, JSON.stringify(products));
}

function getCart() {
  return JSON.parse(localStorage.getItem(cartKey) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function getScanHistory() {
  return JSON.parse(localStorage.getItem(scanKey) || "[]");
}

function saveScanHistory(history) {
  localStorage.setItem(scanKey, JSON.stringify(history));
}

function getPurchaseBills() {
  return JSON.parse(localStorage.getItem(purchaseBillsKey) || "[]");
}

function savePurchaseBills(bills) {
  localStorage.setItem(purchaseBillsKey, JSON.stringify(bills));
}

function formatCurrency(value) {
  return `Rs ${Number(value).toFixed(2)}`;
}

function percentOf(value, max) {
  if (!max || max <= 0) {
    return 0;
  }
  return Math.max(8, Math.min((value / max) * 100, 100));
}

function generateBarcode() {
  return `HM${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function renderInventoryPage() {
  const inventoryForm = document.querySelector("#inventoryForm");
  if (!inventoryForm) {
    return;
  }

  const inventoryTableBody = document.querySelector("#inventoryTableBody");
  const lowStockList = document.querySelector("#lowStockList");
  const searchInput = document.querySelector("#inventorySearch");
  const purchaseBillForm = document.querySelector("#purchaseBillForm");
  const purchaseBillList = document.querySelector("#purchaseBillList");
  const purchaseBillStatus = document.querySelector("#purchaseBillStatus");

  const render = () => {
    const products = getProducts();
    const query = (searchInput.value || "").toLowerCase();
    const filteredProducts = products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.barcode.includes(query)
      );
    });

    inventoryTableBody.innerHTML = filteredProducts.map((product) => {
      const isLow = product.quantity <= product.reorder;
      return `
        <tr>
          <td>
            <div class="product-cell">
              <span>${product.name}</span>
            </div>
          </td>
          <td>
            ${product.image
              ? `<div class="product-thumb"><img src="${product.image}" alt="${product.name}"></div>`
              : `<div class="product-thumb placeholder">No Img</div>`
            }
          </td>
          <td>${product.category}</td>
          <td>${product.barcode}</td>
          <td>${formatCurrency(product.price)}</td>
          <td>${product.quantity}</td>
          <td><span class="stock-badge ${isLow ? "low" : "good"}">${isLow ? "Low Stock" : "In Stock"}</span></td>
        </tr>
      `;
    }).join("");

    const lowItems = products.filter((product) => product.quantity <= product.reorder);
    lowStockList.innerHTML = lowItems.length
      ? lowItems.map((product) => `
          <div class="alert-item">
            <div>
              <strong>${product.name}</strong>
              <p>${product.category} | Barcode: ${product.barcode}</p>
            </div>
            <span class="stock-badge low">${product.quantity} left</span>
          </div>
        `).join("")
      : `<div class="alert-item"><strong>All products are at safe stock levels.</strong></div>`;

    document.querySelector("#totalProducts").textContent = products.length;
    document.querySelector("#lowStockCount").textContent = lowItems.length;
    document.querySelector("#totalUnits").textContent = products.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector("#inventoryValue").textContent = formatCurrency(
      products.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    );

    const purchaseBills = getPurchaseBills();
    purchaseBillList.innerHTML = purchaseBills.length
      ? purchaseBills.map((bill) => `
          <div class="scan-item">
            <div>
              <strong>${bill.supplier}</strong>
              <p>${bill.invoiceNumber} | ${bill.billDate}</p>
              <p>${bill.itemsCount} items | Added ${bill.totalUnits} units</p>
            </div>
            <span class="scan-badge">${formatCurrency(bill.totalValue)}</span>
          </div>
        `).join("")
      : `<div class="scan-item"><strong>No purchase bills imported yet.</strong></div>`;
  };

  inventoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const products = getProducts();
    const newProduct = {
      id: Date.now(),
      name: document.querySelector("#productName").value.trim(),
      category: document.querySelector("#productCategory").value.trim(),
      barcode: document.querySelector("#productBarcode").value.trim(),
      price: Number(document.querySelector("#productPrice").value),
      quantity: Number(document.querySelector("#productQuantity").value),
      reorder: Number(document.querySelector("#productReorder").value),
      image: ""
    };

    products.push(newProduct);
    saveProducts(products);
    inventoryForm.reset();
    render();
  });

  purchaseBillForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const supplier = document.querySelector("#supplierName").value.trim();
    const invoiceNumber = document.querySelector("#invoiceNumber").value.trim();
    const billDate = document.querySelector("#billDate").value;
    const billItemsRaw = document.querySelector("#billItems").value.trim();
    const billImageFile = document.querySelector("#billImage").files?.[0];

    const parsedItems = billItemsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(",").map((part) => part.trim()));

    const invalidLine = parsedItems.find((parts) => parts.length < 4);
    if (invalidLine) {
      purchaseBillStatus.textContent = "Each bill item line must contain: Product Name, Category, Price, Quantity.";
      return;
    }

    const billItems = parsedItems.map((parts) => ({
      name: parts[0],
      category: parts[1],
      price: Number(parts[2]),
      quantity: Number(parts[3])
    }));

    const hasInvalidNumbers = billItems.some((item) => {
      return !item.name || !item.category || item.price <= 0 || item.quantity <= 0;
    });

    if (hasInvalidNumbers) {
      purchaseBillStatus.textContent = "Please check the bill items. Price and quantity must be valid positive numbers.";
      return;
    }

    const products = getProducts();
    billItems.forEach((billItem) => {
      const existingProduct = products.find((product) => {
        return (
          product.name.toLowerCase() === billItem.name.toLowerCase() &&
          product.category.toLowerCase() === billItem.category.toLowerCase()
        );
      });

      if (existingProduct) {
        existingProduct.quantity += billItem.quantity;
        existingProduct.price = billItem.price;
        existingProduct.category = billItem.category;
        existingProduct.name = billItem.name;
      } else {
        products.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          name: billItem.name,
          category: billItem.category,
          barcode: generateBarcode(),
          price: billItem.price,
          quantity: billItem.quantity,
          reorder: 10,
          image: ""
        });
      }
    });

    saveProducts(products);

    const finalizeBillImport = (billImageData = "") => {
      const purchaseBills = getPurchaseBills();
      purchaseBills.unshift({
        id: Date.now(),
        supplier,
        invoiceNumber,
        billDate,
        billImage: billImageData,
        itemsCount: billItems.length,
        totalUnits: billItems.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      });
      savePurchaseBills(purchaseBills.slice(0, 8));
      purchaseBillForm.reset();
      purchaseBillStatus.textContent = `Bill ${invoiceNumber} imported successfully and inventory updated.`;
      render();
    };

    if (!billImageFile) {
      finalizeBillImport("");
      return;
    }

    const billReader = new FileReader();
    billReader.onload = () => finalizeBillImport(billReader.result);
    billReader.readAsDataURL(billImageFile);
  });

  searchInput.addEventListener("input", render);
  render();
}

function renderBillingPage() {
  const billingForm = document.querySelector("#billingForm");
  if (!billingForm) {
    return;
  }

  const productSelect = document.querySelector("#billingProduct");
  const billingTableBody = document.querySelector("#billingTableBody");
  const discountInput = document.querySelector("#discountInput");
  const invoicePreview = document.querySelector("#invoicePreview");
  const printInvoiceBody = document.querySelector("#printInvoiceBody");

  const populateProducts = () => {
    const products = getProducts();
    productSelect.innerHTML = products.map((product) => `
      <option value="${product.id}">${product.name} - ${formatCurrency(product.price)}</option>
    `).join("");
  };

  const renderCart = () => {
    const cart = getCart();

    billingTableBody.innerHTML = cart.length
      ? cart.map((item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
            <td><button class="item-remove" data-remove-id="${item.productId}" type="button">Remove</button></td>
          </tr>
        `).join("")
      : `<tr><td colspan="5">No items in the bill yet.</td></tr>`;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const discount = Number(discountInput.value || 0);
    const grandTotal = Math.max(subtotal + tax - discount, 0);

    document.querySelector("#subtotalAmount").textContent = formatCurrency(subtotal);
    document.querySelector("#taxAmount").textContent = formatCurrency(tax);
    document.querySelector("#discountAmount").textContent = formatCurrency(discount);
    document.querySelector("#grandTotalAmount").textContent = formatCurrency(grandTotal);

    const summaryItems = cart.map((item) => `${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`);
    invoicePreview.innerHTML = cart.length
      ? `
        <strong>Happy Mart Invoice</strong><br>
        ${summaryItems.join("<br>")}<br><br>
        Subtotal: ${formatCurrency(subtotal)}<br>
        Tax: ${formatCurrency(tax)}<br>
        Discount: ${formatCurrency(discount)}<br>
        <strong>Grand Total: ${formatCurrency(grandTotal)}</strong><br>
        <span class="muted">Thank you for shopping at Happy Mart.</span>
      `
      : "No items added yet.";

    printInvoiceBody.innerHTML = cart.length
      ? cart.map((item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4">No items added yet.</td></tr>`;

    document.querySelector("#printSubtotal").textContent = formatCurrency(subtotal);
    document.querySelector("#printTax").textContent = formatCurrency(tax);
    document.querySelector("#printDiscount").textContent = formatCurrency(discount);
    document.querySelector("#printGrandTotal").textContent = formatCurrency(grandTotal);

    document.querySelectorAll("[data-remove-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const updatedCart = getCart().filter((item) => item.productId !== Number(button.dataset.removeId));
        saveCart(updatedCart);
        renderCart();
      });
    });
  };

  const addToCartByProduct = (product, quantity) => {
    const cart = getCart();
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    saveCart(cart);
    renderCart();
  };

  billingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const products = getProducts();
    const selectedProduct = products.find((product) => product.id === Number(productSelect.value));
    const quantity = Number(document.querySelector("#billingQuantity").value);

    if (selectedProduct && quantity > 0) {
      addToCartByProduct(selectedProduct, quantity);
      document.querySelector("#billingQuantity").value = 1;
    }
  });

  document.querySelectorAll("[data-bill-barcode]").forEach((button) => {
    button.addEventListener("click", () => {
      const products = getProducts();
      const product = products.find((item) => item.barcode === button.dataset.billBarcode);
      if (product) {
        addToCartByProduct(product, 1);
      }
    });
  });

  discountInput.addEventListener("input", renderCart);

  document.querySelector("#printBillButton").addEventListener("click", () => {
    const products = getProducts();
    const cart = getCart();

    if (!cart.length) {
      invoicePreview.textContent = "Add items before generating the bill.";
      return;
    }

    const hasLowStockConflict = cart.some((cartItem) => {
      const product = products.find((item) => item.id === cartItem.productId);
      return !product || product.quantity < cartItem.quantity;
    });

    if (hasLowStockConflict) {
      invoicePreview.textContent = "Some cart items do not have enough stock in inventory.";
      return;
    }

    const updatedProducts = products.map((product) => {
      const cartItem = cart.find((item) => item.productId === product.id);
      if (!cartItem) {
        return product;
      }

      return {
        ...product,
        quantity: product.quantity - cartItem.quantity
      };
    });

    saveProducts(updatedProducts);
    saveCart([]);
    const invoiceNumber = `HM-${Date.now().toString().slice(-6)}`;
    const invoiceDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    document.querySelector("#printInvoiceNumber").textContent = `Invoice: ${invoiceNumber}`;
    document.querySelector("#printInvoiceDate").textContent = `Date: ${invoiceDate}`;
    invoicePreview.scrollIntoView({ behavior: "smooth", block: "nearest" });
    invoicePreview.classList.add("flash");
    invoicePreview.innerHTML += "<br><br><strong>Bill generated successfully.</strong>";
    setTimeout(() => invoicePreview.classList.remove("flash"), 600);
    renderCart();
    setTimeout(() => {
      window.print();
    }, 250);
  });

  populateProducts();
  renderCart();
}

function renderScannerPage() {
  const scannerForm = document.querySelector("#scannerForm");
  if (!scannerForm) {
    return;
  }

  const scannerResult = document.querySelector("#scannerResult");
  const scanHistory = document.querySelector("#scanHistory");
  const scannerInput = document.querySelector("#scannerInput");

  const renderHistory = () => {
    const history = getScanHistory();
    scanHistory.innerHTML = history.length
      ? history.map((item) => `
          <div class="scan-item">
            <div>
              <strong>${item.name}</strong>
              <p>Barcode: ${item.barcode}</p>
            </div>
            <span class="scan-badge">${item.time}</span>
          </div>
        `).join("")
      : `<div class="scan-item"><strong>No scans yet.</strong></div>`;
  };

  const runScan = (code) => {
    const products = getProducts();
    const product = products.find((item) => item.barcode === code.trim());

    if (!product) {
      scannerResult.innerHTML = `
        <div>
          <strong>Product not found</strong>
          <p>Please check the barcode and try again.</p>
        </div>
      `;
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const history = getScanHistory();
    history.unshift({ name: product.name, barcode: product.barcode, time: now });
    saveScanHistory(history.slice(0, 6));

    scannerResult.innerHTML = `
      <div>
        <span class="scan-badge">Scanner matched</span>
        <h3>${product.name}</h3>
        <p>Category: ${product.category}</p>
        <p>Barcode: ${product.barcode}</p>
        <p>Price: ${formatCurrency(product.price)}</p>
        <p>Available stock: ${product.quantity}</p>
        <a class="btn btn-secondary" href="billing.html">Send to Billing Page</a>
      </div>
    `;

    renderHistory();
  };

  scannerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runScan(scannerInput.value);
    scannerInput.select();
  });

  document.querySelectorAll("[data-scan-code]").forEach((button) => {
    button.addEventListener("click", () => {
      scannerInput.value = button.dataset.scanCode;
      runScan(button.dataset.scanCode);
    });
  });

  renderHistory();
}

function renderDashboardPage() {
  const dashboardProducts = document.querySelector("#dashboardProducts");
  if (!dashboardProducts) {
    return;
  }

  const products = getProducts();
  const cart = getCart();
  const scans = getScanHistory();
  const lowItems = products.filter((product) => product.quantity <= product.reorder);
  const totalUnits = products.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const maxProductQuantity = Math.max(...products.map((item) => item.quantity), 1);
  const maxCategoryUnits = Math.max(
    ...Object.values(products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + product.quantity;
      return acc;
    }, {})),
    1
  );

  dashboardProducts.textContent = products.length;
  document.querySelector("#dashboardUnits").textContent = totalUnits;
  document.querySelector("#dashboardLowStock").textContent = lowItems.length;
  document.querySelector("#dashboardValue").textContent = formatCurrency(totalValue);
  document.querySelector("#dashboardProductsBar").style.width = `${percentOf(products.length, 20)}%`;
  document.querySelector("#dashboardUnitsBar").style.width = `${percentOf(totalUnits, 250)}%`;
  document.querySelector("#dashboardLowStockBar").style.width = `${percentOf(lowItems.length, Math.max(products.length, 1))}%`;
  document.querySelector("#dashboardValueBar").style.width = `${percentOf(totalValue, 20000)}%`;

  const categoryTotals = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + product.quantity;
    return acc;
  }, {});

  document.querySelector("#dashboardCategoriesChart").innerHTML = Object.keys(categoryTotals).length
    ? Object.entries(categoryTotals).map(([category, quantity]) => `
        <div class="chart-row">
          <div class="chart-meta">
            <span>${category}</span>
            <strong>${quantity} units</strong>
          </div>
          <div class="chart-track">
            <span class="chart-fill success" style="width: ${percentOf(quantity, maxCategoryUnits)}%"></span>
          </div>
        </div>
      `).join("")
    : `<div class="chart-note">No categories yet.</div>`;

  const billingChartMax = Math.max(cartCount, cartValue, scans.length, 1);
  document.querySelector("#dashboardBillingChart").innerHTML = `
    <div class="chart-row">
      <div class="chart-meta">
        <span>Cart Items</span>
        <strong>${cartCount}</strong>
      </div>
      <div class="chart-track">
        <span class="chart-fill" style="width: ${percentOf(cartCount, billingChartMax)}%"></span>
      </div>
    </div>
    <div class="chart-row">
      <div class="chart-meta">
        <span>Cart Value</span>
        <strong>${formatCurrency(cartValue)}</strong>
      </div>
      <div class="chart-track">
        <span class="chart-fill success" style="width: ${percentOf(cartValue, billingChartMax)}%"></span>
      </div>
    </div>
    <div class="chart-row">
      <div class="chart-meta">
        <span>Scanner Entries</span>
        <strong>${scans.length}</strong>
      </div>
      <div class="chart-track">
        <span class="chart-fill warning" style="width: ${percentOf(scans.length, billingChartMax)}%"></span>
      </div>
    </div>
  `;

  document.querySelector("#dashboardLowStockList").innerHTML = lowItems.length
    ? lowItems.map((product) => `
        <div class="chart-row">
          <div class="chart-meta">
            <span>${product.name}</span>
            <strong>${product.quantity}/${product.reorder}</strong>
          </div>
          <div class="chart-track">
            <span class="chart-fill warning" style="width: ${percentOf(product.quantity, Math.max(product.reorder, maxProductQuantity))}%"></span>
          </div>
          <div class="chart-note">${product.category} product close to reorder level.</div>
        </div>
      `).join("")
    : `<div class="chart-note">No low stock alerts right now.</div>`;

  document.querySelector("#dashboardScans").innerHTML = scans.length
    ? scans.map((item) => `
        <div class="scan-chart-item">
          <div class="chart-meta">
            <span>${item.name}</span>
            <strong>${item.time}</strong>
          </div>
          <div class="chart-track">
            <span class="chart-fill" style="width: ${percentOf(item.name.length, 20)}%"></span>
          </div>
          <div class="chart-note">Barcode: ${item.barcode}</div>
        </div>
      `).join("")
    : `<div class="chart-note">No scanner activity yet.</div>`;
}

renderDashboardPage();
renderInventoryPage();
renderBillingPage();
renderScannerPage();
