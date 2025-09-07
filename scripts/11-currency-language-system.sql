-- Multi-currency and multi-language system
-- Create currencies table with live and custom rates
CREATE TABLE IF NOT EXISTS currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL, -- USD, EUR, BDT, etc.
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  is_base_currency BOOLEAN DEFAULT FALSE, -- USD is base
  is_active BOOLEAN DEFAULT TRUE,
  decimal_places INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange rates table with live and custom rate support
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency_id INTEGER REFERENCES currencies(id),
  to_currency_id INTEGER REFERENCES currencies(id),
  live_rate DECIMAL(15,8), -- Rate from external API
  custom_rate DECIMAL(15,8), -- Admin override rate
  use_custom_rate BOOLEAN DEFAULT FALSE, -- Whether to use custom or live rate
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_currency_id, to_currency_id)
);

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
  id SERIAL PRIMARY KEY,
  code VARCHAR(5) UNIQUE NOT NULL, -- en, es, fr, bn, etc.
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rtl BOOLEAN DEFAULT FALSE, -- Right-to-left languages
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences for currency and language
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  currency_id INTEGER REFERENCES currencies(id),
  language_id INTEGER REFERENCES languages(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Translation keys table for multi-language support
CREATE TABLE IF NOT EXISTS translation_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Translations table
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  translation_key_id INTEGER REFERENCES translation_keys(id) ON DELETE CASCADE,
  language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
  translation_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(translation_key_id, language_id)
);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, is_base_currency, decimal_places) VALUES
('USD', 'US Dollar', '$', TRUE, 2),
('EUR', 'Euro', '€', FALSE, 2),
('GBP', 'British Pound', '£', FALSE, 2),
('BDT', 'Bangladeshi Taka', '৳', FALSE, 2),
('INR', 'Indian Rupee', '₹', FALSE, 2),
('CAD', 'Canadian Dollar', 'C$', FALSE, 2),
('AUD', 'Australian Dollar', 'A$', FALSE, 2),
('JPY', 'Japanese Yen', '¥', FALSE, 0)
ON CONFLICT (code) DO NOTHING;

-- Insert default languages
INSERT INTO languages (code, name, native_name, is_default) VALUES
('en', 'English', 'English', TRUE),
('es', 'Spanish', 'Español', FALSE),
('fr', 'French', 'Français', FALSE),
('de', 'German', 'Deutsch', FALSE),
('bn', 'Bengali', 'বাংলা', FALSE),
('hi', 'Hindi', 'हिन्दी', FALSE),
('ar', 'Arabic', 'العربية', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Update languages table to set RTL for Arabic
UPDATE languages SET rtl = TRUE WHERE code = 'ar';

-- Insert some default exchange rates (these will be updated by live rates)
INSERT INTO exchange_rates (from_currency_id, to_currency_id, live_rate, use_custom_rate) 
SELECT 
  usd.id,
  curr.id,
  CASE 
    WHEN curr.code = 'EUR' THEN 0.85
    WHEN curr.code = 'GBP' THEN 0.75
    WHEN curr.code = 'BDT' THEN 122.0
    WHEN curr.code = 'INR' THEN 83.0
    WHEN curr.code = 'CAD' THEN 1.35
    WHEN curr.code = 'AUD' THEN 1.50
    WHEN curr.code = 'JPY' THEN 150.0
    ELSE 1.0
  END,
  FALSE
FROM currencies usd
CROSS JOIN currencies curr
WHERE usd.code = 'USD' AND curr.code != 'USD'
ON CONFLICT (from_currency_id, to_currency_id) DO NOTHING;

-- Insert reverse rates (other currencies to USD)
INSERT INTO exchange_rates (from_currency_id, to_currency_id, live_rate, use_custom_rate)
SELECT 
  curr.id,
  usd.id,
  CASE 
    WHEN curr.code = 'EUR' THEN 1.18
    WHEN curr.code = 'GBP' THEN 1.33
    WHEN curr.code = 'BDT' THEN 0.0082
    WHEN curr.code = 'INR' THEN 0.012
    WHEN curr.code = 'CAD' THEN 0.74
    WHEN curr.code = 'AUD' THEN 0.67
    WHEN curr.code = 'JPY' THEN 0.0067
    ELSE 1.0
  END,
  FALSE
FROM currencies curr
CROSS JOIN currencies usd
WHERE usd.code = 'USD' AND curr.code != 'USD'
ON CONFLICT (from_currency_id, to_currency_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency_id, to_currency_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON translations(translation_key_id, language_id);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_languages_active ON languages(is_active);

-- Insert some basic translation keys
INSERT INTO translation_keys (key_name, description) VALUES
('common.welcome', 'Welcome message'),
('common.login', 'Login button text'),
('common.register', 'Register button text'),
('common.logout', 'Logout button text'),
('common.save', 'Save button text'),
('common.cancel', 'Cancel button text'),
('common.delete', 'Delete button text'),
('common.edit', 'Edit button text'),
('currency.usd', 'US Dollar currency name'),
('currency.eur', 'Euro currency name'),
('currency.bdt', 'Bangladeshi Taka currency name'),
('wallet.balance', 'Wallet balance text'),
('wallet.deposit', 'Deposit button text'),
('wallet.withdraw', 'Withdraw button text')
ON CONFLICT (key_name) DO NOTHING;

-- Insert English translations
INSERT INTO translations (translation_key_id, language_id, translation_text)
SELECT tk.id, l.id, 
  CASE tk.key_name
    WHEN 'common.welcome' THEN 'Welcome'
    WHEN 'common.login' THEN 'Login'
    WHEN 'common.register' THEN 'Register'
    WHEN 'common.logout' THEN 'Logout'
    WHEN 'common.save' THEN 'Save'
    WHEN 'common.cancel' THEN 'Cancel'
    WHEN 'common.delete' THEN 'Delete'
    WHEN 'common.edit' THEN 'Edit'
    WHEN 'currency.usd' THEN 'US Dollar'
    WHEN 'currency.eur' THEN 'Euro'
    WHEN 'currency.bdt' THEN 'Bangladeshi Taka'
    WHEN 'wallet.balance' THEN 'Balance'
    WHEN 'wallet.deposit' THEN 'Deposit'
    WHEN 'wallet.withdraw' THEN 'Withdraw'
  END
FROM translation_keys tk
CROSS JOIN languages l
WHERE l.code = 'en'
ON CONFLICT (translation_key_id, language_id) DO NOTHING;
