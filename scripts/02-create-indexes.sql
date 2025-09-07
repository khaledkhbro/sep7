-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_microjobs_user_id ON microjobs(user_id);
CREATE INDEX idx_microjobs_category_id ON microjobs(category_id);
CREATE INDEX idx_microjobs_status ON microjobs(status);
CREATE INDEX idx_microjobs_created_at ON microjobs(created_at);
CREATE INDEX idx_microjobs_budget ON microjobs(budget_min, budget_max);

CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

CREATE INDEX idx_marketplace_items_seller_id ON marketplace_items(seller_id);
CREATE INDEX idx_marketplace_items_category_id ON marketplace_items(category_id);
CREATE INDEX idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX idx_marketplace_items_price ON marketplace_items(price);

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_job_id ON reviews(job_id);
