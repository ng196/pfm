-- Seed Data for Development

-- Insert default categories (system-wide, user_id is NULL)
INSERT INTO categories (user_id, name, icon, color, budget_limit) VALUES
(NULL, 'Food & Dining', 'fa-utensils', '#FF6B6B', 5000.00),
(NULL, 'Transportation', 'fa-car', '#4ECDC4', 3000.00),
(NULL, 'Shopping', 'fa-shopping-bag', '#45B7D1', 8000.00),
(NULL, 'Entertainment', 'fa-film', '#FFA07A', 2000.00),
(NULL, 'Bills & Utilities', 'fa-file-invoice', '#98D8C8', 4000.00),
(NULL, 'Healthcare', 'fa-heartbeat', '#F7B731', 3000.00),
(NULL, 'Education', 'fa-graduation-cap', '#5F27CD', 5000.00),
(NULL, 'Salary', 'fa-money-bill-wave', '#26DE81', NULL),
(NULL, 'Investment', 'fa-chart-line', '#4B7BEC', NULL),
(NULL, 'Other', 'fa-ellipsis-h', '#95A5A6', NULL);
