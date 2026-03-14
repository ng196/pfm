// Tax Calculator JavaScript - Automatic Calculation

// Tax Slabs for FY 2025-26
const taxSlabs = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 750000, rate: 0.05 },
    { min: 750001, max: 1000000, rate: 0.10 },
    { min: 1000001, max: 1250000, rate: 0.15 },
    { min: 1250001, max: 1500000, rate: 0.20 },
    { min: 1500001, max: Infinity, rate: 0.30 }
];

// GST rates for different categories
const gstRate = 0.18; // Average GST rate
const professionalTaxRate = 0.005; // 0.5% on income
const cessRate = 0.04; // 4% on income tax
const sttRate = 0.001; // 0.1% (estimated for transactions)

// Default account aggregator data
const accountData = {
    annualIncome: 1500000, // ₹15,00,000
    annualExpenses: 480000, // ₹4,80,000
    standardDeduction: 50000 // Standard deduction
};

// Get DOM elements
const displayIncome = document.getElementById('displayIncome');
const displayExpenses = document.getElementById('displayExpenses');
const displaySavings = document.getElementById('displaySavings');

const taxAlert = document.getElementById('taxAlert');
const alertMessage = document.getElementById('alertMessage');
const taxBreakdown = document.getElementById('taxBreakdown');
const tipsSection = document.getElementById('tipsSection');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    calculateAndDisplayTax();
});

function calculateAndDisplayTax() {
    const income = accountData.annualIncome;
    const expenses = accountData.annualExpenses;
    const deduction = accountData.standardDeduction;

    // Calculate taxable income (Income - Standard Deduction)
    const taxableIncome = Math.max(income - deduction, 0);

    // Calculate income tax (base tax before cess)
    const baseTax = calculateBaseTax(taxableIncome);
    
    // Calculate cess on income tax
    const cess = baseTax * cessRate;
    
    // Total income tax (including cess)
    const incomeTax = baseTax + cess;

    // Calculate professional tax
    const professionalTax = income * professionalTaxRate;

    // Calculate GST (on expenses)
    const gstAmount = expenses * gstRate;

    // Calculate STT (on a portion of expenses - assuming 10% are investment-related)
    const investmentPortion = expenses * 0.10;
    const sttAmount = investmentPortion * sttRate;

    // TDS (estimated at 1% of income for interest/other income)
    const tdsAmount = income * 0.01;

    // Calculate total tax liability
    const totalTax = incomeTax + professionalTax + gstAmount + sttAmount + tdsAmount;

    // Calculate percentages
    const incomeTaxPercent = income > 0 ? ((incomeTax / income) * 100).toFixed(2) : 0;
    const professionalTaxPercent = income > 0 ? ((professionalTax / income) * 100).toFixed(2) : 0;
    const gstPercent = expenses > 0 ? ((gstAmount / expenses) * 100).toFixed(2) : 0;

    // Calculate net savings
    const netSavings = income - expenses - totalTax;

    // Display income and expense summary
    displayIncome.textContent = formatCurrency(income);
    displayExpenses.textContent = formatCurrency(expenses);
    displaySavings.textContent = formatCurrency(netSavings);

    // Update alert section
    updateAlert(totalTax, incomeTax, gstAmount, income);

    // Update breakdown section
    updateBreakdown(baseTax, cess, incomeTax, professionalTax, gstAmount, sttAmount, tdsAmount, taxableIncome, totalTax, incomeTaxPercent, professionalTaxPercent, gstPercent);
}

function calculateBaseTax(taxableIncome) {
    let tax = 0;

    for (let slab of taxSlabs) {
        if (taxableIncome > slab.min) {
            const incomeInSlab = Math.min(taxableIncome, slab.max) - slab.min;
            tax += incomeInSlab * slab.rate;
        } else {
            break;
        }
    }

    return tax;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function updateAlert(totalTax, incomeTax, gstAmount, income) {
    const effectiveRate = ((totalTax / income) * 100).toFixed(2);
    
    const message = `
        <span style="display: block; margin-bottom: 0.5rem; font-size: 1.4rem; font-weight: 700; color: #d97706;">
            ${formatCurrency(totalTax)}
        </span>
        <span style="display: block; font-size: 0.95rem;">
            This is the total tax you will pay based on your income and expenses, including Income Tax, Professional Tax, GST, and other applicable taxes.
        </span>
        <span style="display: block; margin-top: 0.5rem; font-size: 0.9rem;">
            Effective Tax Rate: ${effectiveRate}%
        </span>
    `;

    alertMessage.innerHTML = message;
}

function updateBreakdown(baseTax, cess, incomeTax, professionalTax, gstAmount, sttAmount, tdsAmount, taxableIncome, totalTax, incomeTaxPercent, professionalTaxPercent, gstPercent) {
    // Update Taxable Income
    document.getElementById('taxableIncomeValue').textContent = formatCurrency(taxableIncome);

    // Update Income Tax (base tax before cess)
    document.getElementById('incomeTaxValue').textContent = formatCurrency(baseTax);
    document.getElementById('incomeTaxPercent').textContent = `${((baseTax / accountData.annualIncome) * 100).toFixed(2)}%`;

    // Update Cess
    document.getElementById('cessValue').textContent = formatCurrency(cess);
    document.getElementById('cessPercent').textContent = `${((cess / accountData.annualIncome) * 100).toFixed(2)}%`;

    // Update Professional Tax
    document.getElementById('professionalTaxValue').textContent = formatCurrency(professionalTax);
    document.getElementById('professionalTaxPercent').textContent = `${professionalTaxPercent}%`;

    // Update GST
    document.getElementById('gstValue').textContent = formatCurrency(gstAmount);
    document.getElementById('gstPercent').textContent = `${gstPercent}%`;

    // Update STT
    document.getElementById('sttValue').textContent = formatCurrency(sttAmount);
    document.getElementById('sttPercent').textContent = sttAmount > 0 ? '0.1%' : 'N/A';

    // Update TDS
    document.getElementById('tdsValue').textContent = formatCurrency(tdsAmount);
    document.getElementById('tdsPercent').textContent = tdsAmount > 0 ? '1%' : 'N/A';

    // Update Total Tax
    document.getElementById('totalTaxValue').textContent = formatCurrency(totalTax);
}
