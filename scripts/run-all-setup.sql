-- Run all setup scripts in sequence
-- This will create the complete database schema for the microjob marketplace

-- 1. Create core tables
\i scripts/01-create-tables.sql

-- 2. Create indexes for performance
\i scripts/02-create-indexes.sql

-- 3. Seed initial categories
\i scripts/03-seed-categories.sql

-- 4. Create chat system tables
\i scripts/04-create-chat-tables.sql

-- 5. Create chat indexes
\i scripts/05-create-chat-indexes.sql

-- 6. Create category management
\i scripts/06-create-category-management.sql

-- 7. Seed microjob categories
\i scripts/07-seed-microjob-categories.sql

-- 8. Seed fake microjobs for testing
\i scripts/08-seed-fake-microjobs.sql

-- 9. Workflow schema updates
\i scripts/09-workflow-schema-updates.sql

-- 10. Wallet system updates
\i scripts/10-wallet-system-updates.sql

-- 11. Currency and language system
\i scripts/11-currency-language-system.sql

-- 12. Chat money transfer system
\i scripts/12-chat-money-transfer-system.sql

-- 13. Instant payment workflow
\i scripts/13-instant-payment-workflow.sql

-- 14. Screenshot pricing system
\i scripts/14-screenshot-pricing-system.sql

-- 15. Create test jobs with subcategories
\i scripts/15-create-test-jobs-with-subcategories.sql

-- 16. Add sequential job IDs
\i scripts/16-add-sequential-job-ids.sql

-- 17. Platform fee settings
\i scripts/17-platform-fee-settings.sql

-- 18. Job reservation system
\i scripts/18-job-reservation-system.sql

-- 19. Admin settings table
\i scripts/19-admin-settings-table.sql

-- 20. Fix missing tables
\i scripts/20-fix-missing-tables.sql

-- 21. Enhanced revision settings
\i scripts/21-enhanced-revision-settings.sql

-- 22. Ensure support pricing table
\i scripts/22-ensure-support-pricing-table.sql

-- 23. Add transaction constraints
\i scripts/23-add-transaction-constraints.sql
