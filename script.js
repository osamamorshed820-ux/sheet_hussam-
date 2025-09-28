// Initial inventory data categorized
const inventoryCategories = {
    age: [
        { category: "العمر 20-29", total: 20, remaining: 20 },
        { category: "العمر 30-40", total: 30, remaining: 30 }
    ],
    income: [
        { category: "الدخل 401-500 (C2)", total: 60, remaining: 60 },
        { category: "الدخل 501-600 (C1)", total: 41, remaining: 41 },
        { category: "الدخل 601+ (A&B)", total: 48, remaining: 48 }
    ],
    milk: [
        { category: "نيدو", total: 90, remaining: 90 },
        { category: "حليبنا", total: 29, remaining: 29 },
        { category: "إنجوي", total: 29, remaining: 29 }
    ]
};

// Selected categories
let selectedCategories = [];

// DOM Elements
const inventoryTableBody = document.getElementById('inventoryTable').querySelector('tbody');
const transactionTableBody = document.getElementById('transactionTable').querySelector('tbody');
const selectedCategoriesContainer = document.getElementById('selected-categories');
const statusElement = document.getElementById('status');

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateStatus('جاري الاتصال بقاعدة البيانات...', 'info');
    loadData();
});

// Update status message
function updateStatus(message, type = 'info') {
    statusElement.textContent = message;
    statusElement.className = '';
    
    switch(type) {
        case 'success':
            statusElement.style.backgroundColor = '#d4edda';
            statusElement.style.color = '#155724';
            break;
        case 'error':
            statusElement.style.backgroundColor = '#f8d7da';
            statusElement.style.color = '#721c24';
            break;
        case 'info':
        default:
            statusElement.style.backgroundColor = '#d1ecf1';
            statusElement.style.color = '#0c5460';
    }
}

// Load data from API
async function loadData() {
    try {
        updateStatus('جاري تحميل البيانات...', 'info');
        
        const response = await fetch(`${API_BASE}/data`);
        if (!response.ok) {
            throw new Error('Failed to load data from server');
        }
        
        const data = await response.json();
        const inventory = data.inventory || [];
        const transactions = data.transactions || [];
        
        renderInventoryTable(inventory);
        createCategoryButtons();
        renderTransactionTable(transactions);
        
        updateStatus('تم تحميل البيانات بنجاح', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus('حدث خطأ أثناء تحميل البيانات: ' + error.message, 'error');
        
        // Fallback to initial data
        const inventory = [
            ...inventoryCategories.age,
            ...inventoryCategories.income,
            ...inventoryCategories.milk
        ];
        const transactions = [];
        
        renderInventoryTable(inventory);
        createCategoryButtons();
        renderTransactionTable(transactions);
    }
}

// Render inventory table
function renderInventoryTable(inventory) {
    inventoryTableBody.innerHTML = '';
    
    inventory.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.category}</td>
            <td>${item.total}</td>
            <td>${item.remaining}</td>
        `;
        
        inventoryTableBody.appendChild(row);
    });
}

// Create category buttons
function createCategoryButtons() {
    // Age categories
    const ageContainer = document.getElementById('age-categories');
    ageContainer.innerHTML = '';
    inventoryCategories.age.forEach(item => {
        const button = document.createElement('div');
        button.className = 'category-btn';
        button.textContent = item.category;
        button.dataset.category = item.category;
        button.onclick = () => toggleCategory(item.category);
        ageContainer.appendChild(button);
    });
    
    // Income categories
    const incomeContainer = document.getElementById('income-categories');
    incomeContainer.innerHTML = '';
    inventoryCategories.income.forEach(item => {
        const button = document.createElement('div');
        button.className = 'category-btn';
        button.textContent = item.category;
        button.dataset.category = item.category;
        button.onclick = () => toggleCategory(item.category);
        incomeContainer.appendChild(button);
    });
    
    // Milk categories
    const milkContainer = document.getElementById('milk-categories');
    milkContainer.innerHTML = '';
    inventoryCategories.milk.forEach(item => {
        const button = document.createElement('div');
        button.className = 'category-btn';
        button.textContent = item.category;
        button.dataset.category = item.category;
        button.onclick = () => toggleCategory(item.category);
        milkContainer.appendChild(button);
    });
}

// Toggle category selection
function toggleCategory(category) {
    const index = selectedCategories.indexOf(category);
    
    if (index === -1) {
        // Add category to selection
        selectedCategories.push(category);
    } else {
        // Remove category from selection
        selectedCategories.splice(index, 1);
    }
    
    updateSelectedCategoriesDisplay();
    updateCategoryButtonStyles();
}

// Update selected categories display
function updateSelectedCategoriesDisplay() {
    if (selectedCategories.length === 0) {
        selectedCategoriesContainer.innerHTML = '<p>لم يتم اختيار أي فئات بعد</p>';
        return;
    }
    
    selectedCategoriesContainer.innerHTML = '';
    
    selectedCategories.forEach(category => {
        const tag = document.createElement('span');
        tag.className = 'selected-category-tag';
        tag.innerHTML = `
            ${category}
            <button class="remove-btn" onclick="removeCategory('${category}')">×</button>
        `;
        selectedCategoriesContainer.appendChild(tag);
    });
}

// Remove category from selection
function removeCategory(category) {
    const index = selectedCategories.indexOf(category);
    if (index !== -1) {
        selectedCategories.splice(index, 1);
        updateSelectedCategoriesDisplay();
        updateCategoryButtonStyles();
    }
}

// Update category button styles based on selection
function updateCategoryButtonStyles() {
    // Remove selected class from all buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to selected buttons
    selectedCategories.forEach(category => {
        const button = document.querySelector(`.category-btn[data-category="${category}"]`);
        if (button) {
            button.classList.add('selected');
        }
    });
}

// Record consumption for selected categories
async function recordConsumption() {
    if (selectedCategories.length === 0) {
        alert('الرجاء اختيار فئة واحدة على الأقل');
        return;
    }
    
    const notes = document.getElementById('notes').value.trim();
    
    try {
        updateStatus('جاري تسجيل الاستهلاك...', 'info');
        
        const response = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categories: selectedCategories,
                notes: notes
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to record consumption');
        }
        
        // Clear selection and notes
        selectedCategories = [];
        document.getElementById('notes').value = '';
        
        // Update UI
        updateSelectedCategoriesDisplay();
        updateCategoryButtonStyles();
        
        // Reload data to show updated values
        await loadData();
        
        updateStatus('تم تسجيل الاستهلاك بنجاح', 'success');
        alert('تم تسجيل الاستهلاك بنجاح');
    } catch (error) {
        console.error('Error recording consumption:', error);
        updateStatus('حدث خطأ أثناء تسجيل الاستهلاك: ' + error.message, 'error');
        alert('حدث خطأ أثناء تسجيل الاستهلاك: ' + error.message);
    }
}

// Delete a group of transactions
async function deleteTransactionGroup(timestampString) {
    if (confirm('هل أنت متأكد من حذف هذا الاستهلاك؟')) {
        try {
            updateStatus('جاري حذف الاستهلاك...', 'info');
            
            const response = await fetch(`${API_BASE}/transactions/${encodeURIComponent(timestampString)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete transaction');
            }
            
            // Reload data to show updated values
            await loadData();
            
            updateStatus('تم حذف الاستهلاك بنجاح', 'success');
            alert('تم حذف الاستهلاك بنجاح');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            updateStatus('حدث خطأ أثناء حذف الاستهلاك: ' + error.message, 'error');
            alert('حدث خطأ أثناء حذف الاستهلاك: ' + error.message);
        }
    }
}

// Render transaction table grouped by category type
function renderTransactionTable(transactions) {
    transactionTableBody.innerHTML = '';
    
    // Group transactions by time (to show in rows)
    const groupedTransactions = groupTransactionsByTime(transactions);
    
    groupedTransactions.forEach(group => {
        const row = document.createElement('tr');
        
        // Get categories for each type in this transaction
        const ageCategory = getTransactionCategory(group.transactions, 'age');
        const incomeCategory = getTransactionCategory(group.transactions, 'income');
        const milkCategory = getTransactionCategory(group.transactions, 'milk');
        
        // Format date to show time
        const time = new Date(group.timestamp).toLocaleTimeString('ar-SA');
        
        row.innerHTML = `
            <td>${ageCategory || '-'}</td>
            <td>${incomeCategory || '-'}</td>
            <td>${milkCategory || '-'}</td>
            <td>${group.notes || '-'}</td>
            <td>${time}</td>
            <td>
                <button class="delete-btn" onclick="deleteTransactionGroup('${group.timestamp}')">حذف</button>
            </td>
        `;
        
        transactionTableBody.appendChild(row);
    });
}

// Group transactions by timestamp
function groupTransactionsByTime(transactions) {
    const groups = {};
    
    transactions.forEach(transaction => {
        if (!groups[transaction.timestamp]) {
            groups[transaction.timestamp] = {
                timestamp: transaction.timestamp,
                notes: transaction.notes,
                transactions: []
            };
        }
        
        groups[transaction.timestamp].transactions.push(transaction);
    });
    
    // Convert to array and sort by timestamp (newest first)
    return Object.values(groups).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Get category of specific type from transaction group
function getTransactionCategory(transactions, type) {
    for (const transaction of transactions) {
        const category = transaction.category;
        
        if (type === 'age' && inventoryCategories.age.some(item => item.category === category)) {
            return category;
        }
        
        if (type === 'income' && inventoryCategories.income.some(item => item.category === category)) {
            return category;
        }
        
        if (type === 'milk' && inventoryCategories.milk.some(item => item.category === category)) {
            return category;
        }
    }
    
    return null;
}