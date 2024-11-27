const productForm = document.getElementById('productForm');
const productTable = document.querySelector('#productTable tbody');
const totalGainElement = document.querySelector('.total-gain');
const searchInput = document.getElementById('searchInput');
const exportDataButton = document.getElementById('exportDataButton');
const clearAllButton = document.getElementById('clearAllButton');
let products = JSON.parse(localStorage.getItem('products')) || [];
const exchangeRateUSD = 1135; // Tasa de cambio: 1 USD = 1135 ARS
const currencyForm = document.getElementById('currencyForm');
const conversionResult = document.getElementById('conversionResult');

currencyForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);
    const conversionType = document.getElementById('conversionType').value;

    if (isNaN(amount) || amount <= 0) {
        conversionResult.textContent = 'Por favor, ingresa una cantidad válida.';
        return;
    }

    let result;
    if (conversionType === 'usdToArs') {
        result = amount * exchangeRateUSD;
        // Formatear el número como ARS con puntos como separadores de miles y comas como decimales
        conversionResult.textContent = `Resultado: ${result.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`;
    } else if (conversionType === 'arsToUsd') {
        result = amount / exchangeRateUSD;
        // Formatear el número como USD, utilizando el formato con dos decimales y la coma para los decimales
        conversionResult.textContent = `Resultado: ${result.toFixed(2).replace('.', ',')} USD`;
    } else {
        conversionResult.textContent = 'Tipo de conversión no válido.';
    }
});


// Formatear como moneda ARS
function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(value);
}

// Formatear como moneda USD
function formatCurrencyUSD(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

// Guardar productos en localStorage
function saveProductsToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Calcular ganancias
function calculateProfits(product) {
    const profitWithoutShipping = product.salePrice - product.purchasePrice;
    const profitWithShipping = profitWithoutShipping + product.shippingCost;
    const totalARS = product.salePrice + product.shippingCost;

    return { profitWithoutShipping, profitWithShipping, totalARS };
}

// Actualizar totales
function updateTotals() {
    let totalProfitARS = 0;
    let totalProfitUSD = 0;
    let grandTotalARS = 0;

    products.forEach(product => {
        const { profitWithShipping, totalARS } = calculateProfits(product);
        totalProfitARS += profitWithShipping;
        grandTotalARS += totalARS;
    });

    totalProfitUSD = totalProfitARS / exchangeRateUSD;

    // Mostrar los totales en el elemento de ganancia total
    totalGainElement.textContent = `
        Ganancia Total (ARS): ${formatCurrency(totalProfitARS)} | 
        Ganancia Total (USD): ${formatCurrencyUSD(totalProfitUSD)} | 
        Total de Ventas (ARS): ${formatCurrency(grandTotalARS)}
    `;
}

// Filtrar productos
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = productTable.querySelectorAll('tr');
    rows.forEach(row => {
        const productName = row.cells[0]?.textContent.toLowerCase();
        if (productName) {
            row.style.display = productName.includes(searchTerm) ? '' : 'none';
        }
    });
}

// Agregar producto
function addProduct(event) {
    event.preventDefault();

    const productName = document.getElementById('productName').value.trim();
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
    const salePrice = parseFloat(document.getElementById('salePrice').value);
    const shippingCost = parseFloat(document.getElementById('shippingCost').value);

    if (!productName || isNaN(purchasePrice) || isNaN(salePrice) || isNaN(shippingCost)) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }

    const product = { name: productName, purchasePrice, salePrice, shippingCost };

    products.push(product);
    saveProductsToLocalStorage();
    addProductToTable(product, products.length - 1);
    updateTotals();

    productForm.reset();
    filterProducts(); // Asegurar que el nuevo producto respete el filtro actual
}

// Eliminar producto
function deleteProduct(index) {
    products.splice(index, 1);
    saveProductsToLocalStorage();
    loadProducts();
    filterProducts(); // Actualizar la tabla filtrada
}

// Editar producto
function editProduct(index, product) {
    document.getElementById('productName').value = product.name;
    document.getElementById('purchasePrice').value = product.purchasePrice;
    document.getElementById('salePrice').value = product.salePrice;
    document.getElementById('shippingCost').value = product.shippingCost;

    deleteProduct(index);
}

// Cargar productos a la tabla
function loadProducts() {
    productTable.innerHTML = '';
    products.forEach((product, index) => addProductToTable(product, index));
    updateTotals();
}

// Agregar producto a la tabla
function addProductToTable(product, index) {
    const { profitWithoutShipping, profitWithShipping, totalARS } = calculateProfits(product);
    const percentageProfit = ((profitWithShipping / product.purchasePrice) * 100).toFixed(2);

    const row = document.createElement('tr');
    row.dataset.index = index;
    row.innerHTML = `
        <td>${product.name}</td>
        <td>${formatCurrency(product.purchasePrice)}</td>
        <td>${formatCurrency(product.salePrice)}</td>
        <td>${formatCurrency(product.shippingCost)}</td>
        <td>${formatCurrency(totalARS)}</td>
        <td>${formatCurrency(profitWithoutShipping)}</td>
        <td>${formatCurrency(profitWithShipping)}</td>
        <td>${formatCurrencyUSD(profitWithShipping / exchangeRateUSD)}</td>
        <td>${percentageProfit}%</td>
        <td>
            <button class="editButton">Edit</button>
            <button class="deleteButton">del</button>
        </td>
    `;
    productTable.appendChild(row);

    row.querySelector('.deleteButton').addEventListener('click', () => {
        deleteProduct(index);
    });

    row.querySelector('.editButton').addEventListener('click', () => {
        editProduct(index, product);
    });
}

// Exportar datos a CSV
exportDataButton.addEventListener('click', () => {
    const rows = [['Producto', 'Precio de Compra', 'Precio de Venta', 'Costo de Envío', 'Total (ARS)', 'Ganancia Sin Envío (ARS)', 'Ganancia Con Envío (ARS)', 'Ganancia (USD)', 'Porcentaje de Ganancia']];
    document.querySelectorAll('#productTable tbody tr').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent);
        rows.push(cells);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'productos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Eliminar todos los productos
clearAllButton.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas eliminar todos los productos?')) {
        products = [];
        saveProductsToLocalStorage();
        loadProducts();
    }
});

// Escuchar el envío del formulario
productForm.addEventListener('submit', addProduct);

// Escuchar el cambio en el filtro
searchInput.addEventListener('input', filterProducts);

// Inicializar al cargar la página
loadProducts();
