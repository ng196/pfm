export function computeInsights({ accounts = [], transactions = [] }) {
  const totals = transactions.reduce(
    (accumulator, transaction) => {
      const amount = Number(transaction.amount || 0);
      if (transaction.txnType === "CREDIT") {
        accumulator.credit += amount;
      } else {
        accumulator.debit += amount;
      }
      return accumulator;
    },
    { credit: 0, debit: 0 }
  );

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30DaysTransactions = transactions.filter(
    (transaction) => new Date(transaction.txnTimestamp).getTime() >= cutoff
  );

  const last30Days = last30DaysTransactions.reduce(
    (accumulator, transaction) => {
      const amount = Number(transaction.amount || 0);
      if (transaction.txnType === "CREDIT") {
        accumulator.credit += amount;
      } else {
        accumulator.debit += amount;
      }
      return accumulator;
    },
    { credit: 0, debit: 0 }
  );

  const merchantSpend = {};
  for (const transaction of transactions) {
    if (transaction.txnType !== "DEBIT" || !transaction.merchantName) {
      continue;
    }

    merchantSpend[transaction.merchantName] =
      (merchantSpend[transaction.merchantName] || 0) + Number(transaction.amount || 0);
  }

  const monthlyBuckets = {};
  for (const transaction of transactions) {
    const date = new Date(transaction.txnTimestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyBuckets[monthKey]) {
      monthlyBuckets[monthKey] = { credit: 0, debit: 0 };
    }

    if (transaction.txnType === "CREDIT") {
      monthlyBuckets[monthKey].credit += Number(transaction.amount || 0);
    } else {
      monthlyBuckets[monthKey].debit += Number(transaction.amount || 0);
    }
  }

  return {
    totals: {
      lifetimeCredit: Number(totals.credit.toFixed(2)),
      lifetimeDebit: Number(totals.debit.toFixed(2)),
      lifetimeNet: Number((totals.credit - totals.debit).toFixed(2)),
    },
    last30Days: {
      credit: Number(last30Days.credit.toFixed(2)),
      debit: Number(last30Days.debit.toFixed(2)),
      net: Number((last30Days.credit - last30Days.debit).toFixed(2)),
    },
    topMerchants: Object.entries(merchantSpend)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([merchant, spend]) => ({ merchant, spend: Number(spend.toFixed(2)) })),
    monthlyCashflow: Object.entries(monthlyBuckets)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .slice(-6)
      .map(([month, values]) => ({
        month,
        credit: Number(values.credit.toFixed(2)),
        debit: Number(values.debit.toFixed(2)),
        net: Number((values.credit - values.debit).toFixed(2)),
      })),
    accountSnapshot: accounts.map((account) => ({
      accountName: account.accountName,
      fiType: account.fiType,
      currentBalance: account.currentBalance,
      outstandingAmount: account.outstandingAmount,
      currency: account.currency,
    })),
    metadata: {
      txnCount: transactions.length,
      accountCount: accounts.length,
    },
  };
}
