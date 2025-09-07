-- Adding new tables and columns for complete microjob workflow system

-- Update microjobs table to support enhanced workflow statuses
ALTER TABLE microjobs 
ADD COLUMN IF NOT EXISTS assigned_worker_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(20) DEFAULT 'none'; -- 'none', 'locked', 'released', 'refunded'

-- Update job status enum to include all workflow states
-- Note: In production, you'd use ALTER TYPE, but for compatibility we'll handle this in application logic
-- Possible statuses: 'open', 'assigned', 'in_progress', 'proof_submitted', 'under_review', 'completed', 'disputed', 'cancelled'

-- Work proof submissions table
CREATE TABLE work_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT NOT NULL,
    proof_files TEXT[], -- Array of file URLs (images, documents, etc.)
    proof_links TEXT[], -- Array of URLs (YouTube, social media, etc.)
    additional_notes TEXT,
    submission_number INTEGER DEFAULT 1, -- For resubmissions
    status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'under_review', 'accepted', 'rejected', 'revision_requested'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job reviews by employers (accept/reject proof)
CREATE TABLE job_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    proof_id UUID NOT NULL REFERENCES work_proofs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Job poster
    decision VARCHAR(20) NOT NULL, -- 'accepted', 'rejected', 'revision_requested'
    feedback TEXT,
    revision_notes TEXT, -- What needs to be fixed
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment escrow system
CREATE TABLE escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Job poster
    payee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Worker
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'locked', -- 'locked', 'released', 'refunded', 'disputed'
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    release_scheduled_at TIMESTAMP WITH TIME ZONE, -- Auto-release date
    released_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT
);

-- Dispute management system
CREATE TABLE job_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who filed the dispute
    respondent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Other party
    dispute_type VARCHAR(50) NOT NULL, -- 'payment_release', 'work_quality', 'non_delivery', 'unfair_rejection'
    description TEXT NOT NULL,
    evidence_files TEXT[], -- Supporting documents/images
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'closed'
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    assigned_admin_id UUID REFERENCES users(id),
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute messages/communication
CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES job_disputes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments TEXT[], -- File URLs
    is_admin_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job workflow history/audit trail
CREATE TABLE job_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- Who triggered the status change
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    notes TEXT,
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rework requests (when worker chooses to redo work within 72 hours)
CREATE TABLE rework_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES microjobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_proof_id UUID NOT NULL REFERENCES work_proofs(id),
    reason TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL, -- 72 hours from rejection
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'dispute_resolved', 'payment_released', 'user_suspended', etc.
    target_type VARCHAR(50), -- 'job', 'user', 'dispute', etc.
    target_id UUID,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update job_applications to track assignment
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assignment_notes TEXT;
