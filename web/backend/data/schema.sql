-- FinTrack Database Schema

-- 1. USERS
-- Stores profile info and preferences
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACCOUNTS
-- Banks, Cards, Cash, or Wallets
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "HDFC Debit Card"
    type TEXT CHECK (type IN ('bank', 'credit_card', 'cash', 'investment')),
    initial_balance NUMERIC(12,2) DEFAULT 0, -- Balance at the moment of linking
    currency TEXT DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES
-- For grouping transactions
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Null for system defaults
    name TEXT NOT NULL, -- e.g., "Food & Dining"
    icon TEXT, -- e.g., "fa-utensils"
    color TEXT, -- Hex code
    budget_limit NUMERIC(12,2) -- Optional monthly limit
);

-- 4. TRANSACTIONS (The Heavy Lifter)
-- Crucial: Use DECIMAL(12,2) for money, NEVER float/double
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    -- Core Data
    amount NUMERIC(12,2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    merchant_name TEXT, -- e.g., "Starbucks"
    date DATE NOT NULL,
    -- Metadata
    is_recurring BOOLEAN DEFAULT FALSE,
    raw_sms TEXT, -- If parsing from SMS, store raw data for debugging
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dashboard queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);

-- Index for account queries
CREATE INDEX idx_accounts_user ON accounts(user_id);

-- Index for categories
CREATE INDEX idx_categories_user ON categories(user_id);
