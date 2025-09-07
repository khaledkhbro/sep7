package database

import (
	"log"
)

// RunMigrations executes database migrations
func (db *DB) RunMigrations() error {
	migrations := []string{
		createUsersTable,
		createCategoriesTable,
		createMicrojobsTable,
		createJobApplicationsTable,
		createMarketplaceItemsTable,
		createOrdersTable,
		createWalletsTable,
		createWalletTransactionsTable,
		createReviewsTable,
		createNotificationsTable,
		createReferralsTable,
		createReferralCodesTable,
		createChatsTable,
		createChatParticipantsTable,
		createMessagesTable,
		createMessageStatusTable,
		createChatSettingsTable,
		createAdminSettingsTable,
		createPlatformFeeSettingsTable,
		createAdminFeeSettingsTable,
		createSupportPricingSettingsTable,
		createSupportTicketsTable,
		createReservationViolationsTable,
		createUserFavoritesTable,
		createJobReservationsTable,
		createWorkProofsTable,
		createIndexes,
	}

	for i, migration := range migrations {
		log.Printf("Running migration %d/%d", i+1, len(migrations))
		if _, err := db.Exec(migration); err != nil {
			log.Printf("Migration %d failed: %v", i+1, err)
			return err
		}
	}

	log.Println("All migrations completed successfully")
	return nil
}

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    skills TEXT[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    user_type VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createCategoriesTable = `
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createMicrojobsTable = `
CREATE TABLE IF NOT EXISTS microjobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    deadline DATE,
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(10) DEFAULT 'normal',
    attachments TEXT[] DEFAULT '{}',
    skills_required TEXT[] DEFAULT '{}',
    applications_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createJobApplicationsTable = `
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    proposed_budget DECIMAL(10,2),
    estimated_duration VARCHAR(50),
    portfolio_links TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, applicant_id)
);`

const createMarketplaceItemsTable = `
CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    delivery_time INTEGER NOT NULL,
    revisions_included INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'active',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createOrdersTable = `
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_item_id UUID NOT NULL REFERENCES marketplace_items(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requirements_provided TEXT,
    delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createWalletsTable = `
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00,
    total_earned DECIMAL(12,2) DEFAULT 0.00,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);`

const createWalletTransactionsTable = `
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createReviewsTable = `
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    job_id UUID REFERENCES microjobs(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reviewer_id, order_id),
    UNIQUE(reviewer_id, job_id)
);`

const createNotificationsTable = `
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createReferralsTable = `
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reward_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);`

const createReferralCodesTable = `
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);`


const createChatsTable = `
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'order', 'admin_support')),
    title VARCHAR(255),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    job_id UUID REFERENCES microjobs(id) ON DELETE CASCADE,
    marketplace_item_id UUID REFERENCES marketplace_items(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`

const createChatParticipantsTable = `
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'moderator')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(chat_id, user_id)
);`

const createMessagesTable = `
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    content TEXT NOT NULL,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`

const createMessageStatusTable = `
CREATE TABLE IF NOT EXISTS message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);`

const createChatSettingsTable = `
CREATE TABLE IF NOT EXISTS chat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    muted_until TIMESTAMP WITH TIME ZONE,
    custom_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, chat_id)
);`

const createAdminSettingsTable = `
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createPlatformFeeSettingsTable = `
CREATE TABLE IF NOT EXISTS platform_fee_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN DEFAULT TRUE,
    percentage DECIMAL(5,2) DEFAULT 5.00,
    fixed_fee DECIMAL(10,2) DEFAULT 0.00,
    minimum_fee DECIMAL(10,2) DEFAULT 0.00,
    maximum_fee DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createAdminFeeSettingsTable = `
CREATE TABLE IF NOT EXISTS admin_fee_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type VARCHAR(50) UNIQUE NOT NULL,
    fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    fee_fixed DECIMAL(10,2) DEFAULT 0.00,
    minimum_fee DECIMAL(10,2) DEFAULT 0.00,
    maximum_fee DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createSupportPricingSettingsTable = `
CREATE TABLE IF NOT EXISTS support_pricing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    support_type VARCHAR(20) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    response_time_hours INTEGER NOT NULL DEFAULT 24,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createSupportTicketsTable = `
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
    ticket_type VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'open',
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    response_time_hours INTEGER DEFAULT 24,
    payment_transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createReservationViolationsTable = `
CREATE TABLE IF NOT EXISTS reservation_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_count INTEGER DEFAULT 1,
    last_violation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_reservations INTEGER DEFAULT 0,
    expired_reservations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);`

const createUserFavoritesTable = `
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);`

const createJobReservationsTable = `
CREATE TABLE IF NOT EXISTS job_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

const createWorkProofsTable = `
CREATE TABLE IF NOT EXISTS work_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_amount DECIMAL(10,2) NOT NULL,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE
);`

const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_microjobs_status ON microjobs(status);
CREATE INDEX IF NOT EXISTS idx_microjobs_category_id ON microjobs(category_id);
CREATE INDEX IF NOT EXISTS idx_microjobs_user_id ON microjobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_work_proofs_job_id ON work_proofs(job_id);
CREATE INDEX IF NOT EXISTS idx_work_proofs_worker_id ON work_proofs(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_proofs_status ON work_proofs(status);
CREATE INDEX IF NOT EXISTS idx_job_reservations_job_id ON job_reservations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_reservations_user_id ON job_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_job_reservations_expires_at ON job_reservations(expires_at);
`
