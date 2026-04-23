export function parseAmount(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).replace(/[^0-9.-]/g, "");
  if (!normalized) {
    return null;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : null;
}

export function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}
