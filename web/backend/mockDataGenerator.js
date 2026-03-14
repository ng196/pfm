import { v4 as uuidv4 } from 'uuid';

// --- HELPER FUNCTIONS FOR COHERENCE ---
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomAmount = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const USER_PROFILES = [
    { name: "Rahul Sharma", pan: "ABCPA1234K", mobile: "9876543210", email: "rahul@example.com" },
    { name: "Priya Singh", pan: "DEFPQ5678L", mobile: "9123456780", email: "priya@example.com" }
];

// --- MASTER GENERATOR FUNCTION ---
export function generateFIData(fiType, userContext) {
    const user = userContext || randomItem(USER_PROFILES);
    
    switch(fiType) {
        case "DEPOSIT": return generateBankDeposit(user);
        case "TERM_DEPOSIT": return generateTermDeposit(user);
        case "RECURRING_DEPOSIT": return generateRecurringDeposit(user);
        case "MUTUAL_FUNDS": return generateMutualFunds(user);
        case "EQUITIES": return generateEquities(user);
        case "ETF": return generateETF(user);
        case "INSURANCE_POLICIES": return generateInsurance(user);
        case "NPS": return generateNPS(user);
        case "GSTR1_3B": return generateGST(user);
        
        case "BONDS":
        case "DEBENTURES":
        case "AIF":
        case "INVIT":
        case "REIT":
        case "GOVT_SECURITIES":
        case "CIS":
        case "IDR":
            return generateGenericInvestment(user, fiType);

        default:
            return generateGenericInvestment(user, fiType);
    }
}

// --- SPECIFIC GENERATORS ---

function generateBankDeposit(user) {
    const currentBalance = parseFloat(randomAmount(5000, 200000));
    const transactions = [];
    let runningBalance = currentBalance;
    
    for (let i = 0; i < 10; i++) {
        const type = Math.random() > 0.4 ? "DEBIT" : "CREDIT";
        const amount = parseFloat(randomAmount(100, 10000));
        
        if (type === "DEBIT") runningBalance += amount;
        else runningBalance -= amount;

        transactions.push({
            txnId: uuidv4(),
            type: type,
            mode: type === "DEBIT" ? randomItem(["UPI", "ATM", "NEFT", "CARD"]) : randomItem(["NEFT", "IMPS", "UPI"]),
            amount: amount.toFixed(2),
            currentBalance: runningBalance.toFixed(2),
            transactionTimestamp: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
            narration: type === "DEBIT" 
                ? `UPI/${Math.floor(Math.random()*100000)}/${randomItem(["SWIGGY", "AMAZON", "ZOMATO", "PAYTM"])}` 
                : `NEFT/INFLOW/${randomItem(["SALARY", "FREELANCE", "FRIEND"])}`,
            reference: uuidv4(),
            valueDate: new Date().toISOString().split('T')[0]
        });
    }

    return {
        "fiType": "DEPOSIT",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "type": randomItem(["SAVINGS", "CURRENT"]),
            "branch": "MUMBAI MAIN",
            "ifscCode": "SBIN0001234",
            "maskedAccountNumber": "XXXXXX" + Math.floor(Math.random() * 9000 + 1000),
            "currentBalance": currentBalance.toFixed(2),
            "currency": "INR",
            "status": "ACTIVE"
        },
        "transactions": { "transaction": transactions.reverse() }
    };
}

function generateMutualFunds(user) {
    const schemes = [
        { name: "Axis Bluechip Fund", plan: "Growth", type: "EQUITY" },
        { name: "HDFC Balanced Advantage Fund", plan: "Dividend", type: "HYBRID" },
        { name: "SBI Small Cap Fund", plan: "Growth", type: "EQUITY" }
    ];
    const selected = randomItem(schemes);
    const units = parseFloat(randomAmount(100, 5000));
    const nav = parseFloat(randomAmount(10, 100));

    return {
        "fiType": "MUTUAL_FUNDS",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "maskedAccountNumber": "MF" + Math.floor(Math.random() * 90000),
            "currentValue": (units * nav).toFixed(2),
            "investmentValue": (units * (nav * 0.8)).toFixed(2),
            "holdings": {
                "holding": [{
                    "schemeName": selected.name,
                    "plan": selected.plan,
                    "schemeType": selected.type,
                    "units": units.toFixed(2),
                    "nav": nav.toFixed(2),
                    "navDate": new Date().toISOString().split('T')[0],
                    "isin": "INF" + Math.floor(Math.random() * 90000000000)
                }]
            }
        },
        "transactions": { 
            "transaction": [{
                "type": "BUY",
                "amount": randomAmount(1000, 50000),
                "units": parseFloat(randomAmount(10, 100)).toFixed(2),
                "nav": nav.toFixed(2),
                "txnDate": randomDate(new Date(2022, 0, 1), new Date()).toISOString()
            }]
        }
    };
}

function generateEquities(user) {
    const stocks = [
        { symbol: "RELIANCE", isin: "INE002A01018" },
        { symbol: "TCS", isin: "INE467B01029" },
        { symbol: "INFY", isin: "INE009A01021" }
    ];
    const selected = randomItem(stocks);
    const quantity = Math.floor(Math.random() * 50 + 1);
    const price = parseFloat(randomAmount(500, 3500));

    return {
        "fiType": "EQUITIES",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "maskedAccountNumber": "DEMAT" + Math.floor(Math.random() * 9000),
            "currentValue": (quantity * price).toFixed(2),
            "holdings": {
                "holding": [{
                    "symbol": selected.symbol,
                    "isin": selected.isin,
                    "quantity": quantity,
                    "currentPrice": price.toFixed(2),
                    "avgBuyPrice": (price * 0.9).toFixed(2),
                    "sector": randomItem(["IT", "ENERGY", "FINANCE"])
                }]
            }
        },
        "transactions": { 
            "transaction": [{
                "type": "BUY",
                "quantity": quantity,
                "price": (price * 0.9).toFixed(2),
                "txnDate": randomDate(new Date(2022, 0, 1), new Date()).toISOString()
            }]
        }
    };
}

function generateTermDeposit(user) {
    const principal = parseFloat(randomAmount(10000, 200000));
    const rate = (Math.random() * 3 + 5).toFixed(2);
    
    return {
        "fiType": "TERM_DEPOSIT",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "type": "FIXED_DEPOSIT",
            "maskedAccountNumber": "FD" + Math.floor(Math.random() * 90000),
            "principalAmount": principal.toFixed(2),
            "interestRate": rate,
            "maturityDate": randomDate(new Date(2024, 0, 1), new Date(2028, 0, 1)).toISOString().split('T')[0],
            "maturityAmount": (principal * (1 + (rate/100) * 2)).toFixed(2),
            "status": "ACTIVE"
        },
        "transactions": { "transaction": [] }
    };
}

function generateInsurance(user) {
    return {
        "fiType": "INSURANCE_POLICIES",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "policyName": randomItem(["LIFE SHIELD", "HEALTH PLUS", "TERM CARE"]),
            "policyNumber": "POL" + Math.floor(Math.random() * 9000000),
            "sumAssured": randomAmount(500000, 5000000),
            "premiumAmount": randomAmount(5000, 50000),
            "nextPremiumDueDate": randomDate(new Date(), new Date(2024, 0, 1)).toISOString().split('T')[0],
            "status": "ACTIVE"
        }
    };
}

function generateNPS(user) {
    return {
        "fiType": "NPS",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "pranId": "NPS" + Math.floor(Math.random() * 9000000),
            "currentBalance": randomAmount(50000, 500000),
            "equityAssetValue": randomAmount(10000, 100000),
            "debtAssetValue": randomAmount(10000, 100000),
            "tier1Status": "ACTIVE"
        }
    };
}

function generateGST(user) {
    return {
        "fiType": "GSTR1_3B",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "gstin": "27" + user.pan + "1Z5",
            "turnover": randomAmount(1000000, 50000000),
            "taxLiability": randomAmount(5000, 500000),
            "returnPeriod": "102023"
        }
    };
}

function generateRecurringDeposit(user) {
    return {
        "fiType": "RECURRING_DEPOSIT",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "maskedAccountNumber": "RD" + Math.floor(Math.random() * 90000),
            "monthlyInstallment": randomAmount(1000, 10000),
            "interestRate": (Math.random() * 2 + 5).toFixed(2),
            "maturityDate": randomDate(new Date(2024, 0, 1), new Date(2028, 0, 1)).toISOString().split('T')[0],
            "status": "ACTIVE"
        }
    };
}

function generateETF(user) {
    return {
        "fiType": "ETF",
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "maskedAccountNumber": "ETF" + Math.floor(Math.random() * 90000),
            "currentValue": randomAmount(10000, 100000),
            "holdings": {
                "holding": [{
                    "symbol": randomItem(["NIFTYBEES", "GOLDBEES", "BANKBEES"]),
                    "units": parseFloat(randomAmount(10, 500)).toFixed(2),
                    "currentNav": randomAmount(10, 100)
                }]
            }
        }
    };
}

function generateGenericInvestment(user, type) {
    return {
        "fiType": type,
        "profile": { "holders": { "holder": [user] } },
        "summary": {
            "maskedAccountNumber": type.substring(0,3) + Math.floor(Math.random() * 90000),
            "currentValue": randomAmount(50000, 1000000),
            "description": `Mock description for ${type}`,
            "status": "ACTIVE"
        }
    };
}
