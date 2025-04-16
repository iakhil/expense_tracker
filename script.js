// Initialize data structure
let expenseData = {
    categories: ['Rent', 'Groceries', 'Utilities'],
    months: {}
};

// DOM elements
const monthSelect = document.getElementById('month-select');
const paycheckDateInput = document.getElementById('paycheck-date');
const paycheckAmountInput = document.getElementById('paycheck-amount');
const addPaycheckBtn = document.getElementById('add-paycheck-btn');
const expenseAmount = document.getElementById('expense-amount');
const expenseCategory = document.getElementById('expense-category');
const addExpenseBtn = document.getElementById('add-expense-btn');
const newCategoryName = document.getElementById('new-category-name');
const addCategoryBtn = document.getElementById('add-category-btn');
const currentMonthSummary = document.getElementById('current-month-summary');
const summaryPaycheck = document.getElementById('summary-paycheck');
const summaryExpenses = document.getElementById('summary-expenses');
const summarySavings = document.getElementById('summary-savings');
const paychecksUl = document.getElementById('paychecks-ul');
const expensesUl = document.getElementById('expenses-ul');

// Initialize application
function init() {
    // Load data from localStorage
    const savedData = localStorage.getItem('expenseData');
    if (savedData) {
        expenseData = JSON.parse(savedData);
    }
    
    // Populate months dropdown
    populateMonths();
    
    // Populate categories
    updateCategoryDropdown();
    
    // Set current month as selected
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
    monthSelect.value = currentMonthYear;

    // Set today's date as default for paycheck date
    paycheckDateInput.valueAsDate = new Date();
    
    // If current month doesn't exist in data, initialize it
    if (!expenseData.months[currentMonthYear]) {
        expenseData.months[currentMonthYear] = {
            paychecks: [],
            expenses: []
        };
        saveData();
    }
    
    // Convert old data format if needed (migration from old to new format)
    migrateOldData();
    
    // Load selected month data
    loadMonthData(currentMonthYear);
    
    // Add event listeners
    monthSelect.addEventListener('change', onMonthChange);
    addPaycheckBtn.addEventListener('click', addPaycheck);
    addExpenseBtn.addEventListener('click', addExpense);
    addCategoryBtn.addEventListener('click', addCategory);
}

// Migrate old data format (single paycheck value) to new format (array of paychecks)
function migrateOldData() {
    for (const monthKey in expenseData.months) {
        const monthData = expenseData.months[monthKey];
        
        // If it has the old 'paycheck' property but no 'paychecks' array
        if (monthData.paycheck !== undefined && !monthData.paychecks) {
            // Create paychecks array
            monthData.paychecks = [];
            
            // If there was a non-zero paycheck, add it as a single paycheck
            if (monthData.paycheck > 0) {
                const monthYear = monthKey.split('-');
                const year = parseInt(monthYear[0]);
                const month = parseInt(monthYear[1]) - 1;
                
                monthData.paychecks.push({
                    id: Date.now(),
                    date: new Date(year, month, 15).toISOString().split('T')[0], // Middle of month as default
                    amount: monthData.paycheck
                });
            }
            
            // Delete old property
            delete monthData.paycheck;
        }
    }
    
    saveData();
}

// Populate months dropdown (current month + 5 past months + 5 future months)
function populateMonths() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Clear dropdown
    monthSelect.innerHTML = '';
    
    // Add 5 past months, current month, and 5 future months
    for (let i = -5; i <= 5; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = monthName;
        monthSelect.appendChild(option);
    }
}

// Update category dropdown with current categories
function updateCategoryDropdown() {
    // Save current selection
    const currentSelection = expenseCategory.value;
    
    // Clear dropdown except for first option
    while (expenseCategory.options.length > 1) {
        expenseCategory.remove(1);
    }
    
    // Add categories
    expenseData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        expenseCategory.appendChild(option);
    });
    
    // Restore selection if possible
    if (currentSelection && expenseData.categories.includes(currentSelection)) {
        expenseCategory.value = currentSelection;
    }
}

// Handle month change
function onMonthChange() {
    const selectedMonth = monthSelect.value;
    
    // Initialize month data if it doesn't exist
    if (!expenseData.months[selectedMonth]) {
        expenseData.months[selectedMonth] = {
            paychecks: [],
            expenses: []
        };
        saveData();
    }
    
    // Load selected month data
    loadMonthData(selectedMonth);
}

// Load data for selected month
function loadMonthData(monthYear) {
    const monthData = expenseData.months[monthYear];
    
    // Update UI
    currentMonthSummary.textContent = new Date(parseInt(monthYear.split('-')[0]), parseInt(monthYear.split('-')[1]) - 1, 1)
        .toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Update expenses and paychecks lists
    renderPaychecks(monthData.paychecks);
    renderExpenses(monthData.expenses);
    
    // Update summary
    updateSummary(monthData);
}

// Add new paycheck
function addPaycheck() {
    // Validate inputs
    if (!paycheckDateInput.value || !paycheckAmountInput.value) {
        alert('Please enter both date and amount for the paycheck!');
        return;
    }
    
    const paycheck = {
        id: Date.now(),
        date: paycheckDateInput.value,
        amount: parseFloat(paycheckAmountInput.value)
    };
    
    // Extract month from the paycheck date to categorize it
    const paycheckDate = new Date(paycheck.date);
    const paycheckMonthYear = `${paycheckDate.getFullYear()}-${paycheckDate.getMonth() + 1}`;
    
    // Initialize month data if it doesn't exist
    if (!expenseData.months[paycheckMonthYear]) {
        expenseData.months[paycheckMonthYear] = {
            paychecks: [],
            expenses: []
        };
    }
    
    // Add paycheck to the month it belongs to (based on date)
    expenseData.months[paycheckMonthYear].paychecks.push(paycheck);
    saveData();
    
    // Clear inputs but keep date
    paycheckAmountInput.value = '';
    
    // If adding to currently selected month, update UI
    if (paycheckMonthYear === monthSelect.value) {
        renderPaychecks(expenseData.months[paycheckMonthYear].paychecks);
        updateSummary(expenseData.months[paycheckMonthYear]);
    } else {
        // Notify that the paycheck was added to a different month
        alert(`Paycheck was added to ${new Date(paycheckDate.getFullYear(), paycheckDate.getMonth(), 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`);
    }
}

// Add new expense
function addExpense() {
    // Validate inputs
    if (!expenseAmount.value || !expenseCategory.value) {
        alert('Please fill all expense fields!');
        return;
    }
    
    const expense = {
        id: Date.now(), // Use timestamp as unique ID
        amount: parseFloat(expenseAmount.value),
        category: expenseCategory.value
    };
    
    const selectedMonth = monthSelect.value;
    expenseData.months[selectedMonth].expenses.push(expense);
    saveData();
    
    // Clear inputs
    expenseAmount.value = '';
    expenseCategory.value = '';
    
    // Update UI
    renderExpenses(expenseData.months[selectedMonth].expenses);
    updateSummary(expenseData.months[selectedMonth]);
}

// Add new category
function addCategory() {
    const category = newCategoryName.value.trim();
    
    // Validate
    if (!category) {
        alert('Please enter a category name!');
        return;
    }
    
    // Check if category already exists
    if (expenseData.categories.includes(category)) {
        alert('This category already exists!');
        return;
    }
    
    // Add category
    expenseData.categories.push(category);
    saveData();
    
    // Update dropdown
    updateCategoryDropdown();
    
    // Clear input
    newCategoryName.value = '';
}

// Delete paycheck
function deletePaycheck(id) {
    const selectedMonth = monthSelect.value;
    const monthData = expenseData.months[selectedMonth];
    
    // Find and remove paycheck
    monthData.paychecks = monthData.paychecks.filter(paycheck => paycheck.id !== id);
    saveData();
    
    // Update UI
    renderPaychecks(monthData.paychecks);
    updateSummary(monthData);
}

// Delete expense
function deleteExpense(id) {
    const selectedMonth = monthSelect.value;
    const monthData = expenseData.months[selectedMonth];
    
    // Find and remove expense
    monthData.expenses = monthData.expenses.filter(expense => expense.id !== id);
    saveData();
    
    // Update UI
    renderExpenses(monthData.expenses);
    updateSummary(monthData);
}

// Render paychecks list
function renderPaychecks(paychecks) {
    // Clear list
    paychecksUl.innerHTML = '';
    
    // Sort paychecks by date
    const sortedPaychecks = [...paychecks].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add paychecks
    sortedPaychecks.forEach(paycheck => {
        const li = document.createElement('li');
        
        const dateDiv = document.createElement('div');
        dateDiv.className = 'paycheck-date';
        // Format date in a more readable way (MM/DD/YYYY)
        const formattedDate = new Date(paycheck.date).toLocaleDateString();
        dateDiv.textContent = formattedDate;
        
        const amountDiv = document.createElement('div');
        amountDiv.className = 'paycheck-amount';
        amountDiv.textContent = `$${paycheck.amount.toFixed(2)}`;
        
        const rightContainer = document.createElement('div');
        rightContainer.style.display = 'flex';
        rightContainer.style.alignItems = 'center';
        rightContainer.style.gap = '1rem';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deletePaycheck(paycheck.id));
        
        rightContainer.appendChild(amountDiv);
        rightContainer.appendChild(deleteBtn);
        
        li.appendChild(dateDiv);
        li.appendChild(rightContainer);
        
        paychecksUl.appendChild(li);
    });
}

// Render expenses list
function renderExpenses(expenses) {
    // Clear list
    expensesUl.innerHTML = '';
    
    // Add expenses
    expenses.forEach(expense => {
        const li = document.createElement('li');
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'expense-category';
        categoryDiv.textContent = expense.category;
        
        const amountDiv = document.createElement('div');
        amountDiv.className = 'expense-amount';
        amountDiv.textContent = `$${expense.amount.toFixed(2)}`;
        
        const rightContainer = document.createElement('div');
        rightContainer.style.display = 'flex';
        rightContainer.style.alignItems = 'center';
        rightContainer.style.gap = '1rem';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteExpense(expense.id));
        
        rightContainer.appendChild(amountDiv);
        rightContainer.appendChild(deleteBtn);
        
        li.appendChild(categoryDiv);
        li.appendChild(rightContainer);
        
        expensesUl.appendChild(li);
    });
}

// Update summary
function updateSummary(monthData) {
    // Calculate total income from paychecks
    const totalPaychecks = monthData.paychecks.reduce((total, paycheck) => total + paycheck.amount, 0);
    
    // Calculate total expenses
    const totalExpenses = monthData.expenses.reduce((total, expense) => total + expense.amount, 0);
    
    // Update UI
    summaryPaycheck.textContent = totalPaychecks.toFixed(2);
    summaryExpenses.textContent = totalExpenses.toFixed(2);
    summarySavings.textContent = (totalPaychecks - totalExpenses).toFixed(2);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('expenseData', JSON.stringify(expenseData));
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init); 