CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'buyer',
    seller_approved BOOLEAN DEFAULT FALSE,
    address TEXT NOT NULL,
    birthday DATE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Categories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE subcategories (
    subcategory_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Listings
CREATE TYPE listing_status AS ENUM ('active', 'ended', 'sold');

CREATE TABLE listings (
    listing_id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(user_id),
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    subcategory_id INTEGER NOT NULL REFERENCES subcategories(subcategory_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    starting_price DECIMAL(10, 2) NOT NULL,
    current_bid DECIMAL(10, 2) NOT NULL,
    step_price DECIMAL(10, 2) NOT NULL,
    buy_now_price DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL,
    item_condition VARCHAR(50) NOT NULL,
    shipping_cost DECIMAL(10, 2) NOT NULL,
    return_policy TEXT NOT NULL,
    images JSONB NOT NULL,
    auto_extended_dates JSONB NOT NULL,
    rejected_bidders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Full-text search index for listings (title + category + subcategory)
CREATE INDEX IF NOT EXISTS listings_search_idx ON listings USING GIN (
  to_tsvector('english',
    title || ' ' ||
    coalesce((SELECT name FROM categories WHERE categories.category_id = listings.category_id), '') || ' ' ||
    coalesce((SELECT name FROM subcategories WHERE subcategories.subcategory_id = listings.subcategory_id), '')
  )
);

-- Bids
CREATE TABLE bids (
    bid_id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    bidder_id INTEGER NOT NULL REFERENCES users(user_id),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- AutoBids
CREATE TABLE auto_bids (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    max_limit DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Orders
CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'shipped', 'delivered', 'cancelled');

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    buyer_id INTEGER NOT NULL REFERENCES users(user_id),
    seller_id INTEGER NOT NULL REFERENCES users(user_id),
    final_price DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending_payment',
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Watchlists
CREATE TABLE watchlists (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, listing_id)
);

-- SellerRequests
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE seller_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    status request_status DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(user_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ListingQuestions
CREATE TABLE listing_questions (
    question_id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    question_text TEXT NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ratings table for buyer/seller up/down ratings
CREATE TABLE ratings (
    rating_id SERIAL PRIMARY KEY,
    target_user_id INTEGER NOT NULL REFERENCES users(user_id),
    rater_user_id INTEGER NOT NULL REFERENCES users(user_id),
    rating SMALLINT NOT NULL CHECK (rating IN (1, -1)),
    role VARCHAR(50) NOT NULL CHECK (role IN ('buyer','seller')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Basic constraints to enforce data sanity
ALTER TABLE listings
  ADD CONSTRAINT listing_start_nonnegative CHECK (starting_price >= 0),
  ADD CONSTRAINT listing_step_positive CHECK (step_price > 0),
  ADD CONSTRAINT listing_current_nonnegative CHECK (current_bid >= 0),
  ADD CONSTRAINT listing_buynow_ge_start CHECK (buy_now_price IS NULL OR buy_now_price >= starting_price);

ALTER TABLE bids
  ADD CONSTRAINT bids_positive_amount CHECK (amount > 0);

-- =========================
-- Seed test data
-- =========================

-- Additional test users for validation scenarios
INSERT INTO users (email, password_hash, name, avatar_url, role, seller_approved, address, birthday)
VALUES
('lowbidder@example.com', crypt('password123', gen_salt('bf', 10)), 'Low Bidder', 'https://example.com/avatars/low.jpg', 'buyer', FALSE, '1 Low St', '1995-06-06'),
('highbidder@example.com', crypt('password123', gen_salt('bf', 10)), 'High Bidder', 'https://example.com/avatars/high.jpg', 'buyer', FALSE, '2 High St', '1994-05-05'),
('rejectedbidder@example.com', crypt('password123', gen_salt('bf', 10)), 'Rejected Bidder', 'https://example.com/avatars/rej.jpg', 'buyer', FALSE, '3 Rej St', '1993-04-04');

-- Low bidder: 1 up, 9 down => 10% positive
INSERT INTO ratings (target_user_id, rater_user_id, rating, role)
SELECT (SELECT user_id FROM users WHERE email='lowbidder@example.com'), user_id, -1, 'buyer'
FROM users WHERE role='seller' LIMIT 9;
INSERT INTO ratings (target_user_id, rater_user_id, rating, role)
VALUES ((SELECT user_id FROM users WHERE email='lowbidder@example.com'), (SELECT user_id FROM users WHERE email='admin1@example.com'), 1, 'buyer');

-- High bidder: 9 up, 1 down => 90% positive
INSERT INTO ratings (target_user_id, rater_user_id, rating, role)
SELECT (SELECT user_id FROM users WHERE email='highbidder@example.com'), user_id, 1, 'buyer'
FROM users WHERE role='seller' LIMIT 9;
INSERT INTO ratings (target_user_id, rater_user_id, rating, role)
VALUES ((SELECT user_id FROM users WHERE email='highbidder@example.com'), (SELECT user_id FROM users WHERE email='admin1@example.com'), -1, 'buyer');

-- Listing that rejects a specific bidder
INSERT INTO listings (seller_id, title, description, category_id, subcategory_id, starting_price, current_bid, step_price, buy_now_price, status, item_condition, shipping_cost, return_policy, images, auto_extended_dates, rejected_bidders, ends_at)
VALUES
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Rejected Listing', 'Seller rejected a bidder for testing', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Phones' LIMIT 1), 30.00, 30.00, 1.00, NULL, 'active', 'new', 0.00, 'no returns', '[]'::jsonb, (SELECT jsonb_build_array((SELECT user_id FROM users WHERE email='rejectedbidder@example.com'))), now() + interval '7 days');

-- Buy-now listing (buyNowPrice set)
INSERT INTO listings (seller_id, title, description, category_id, subcategory_id, starting_price, current_bid, step_price, buy_now_price, status, item_condition, shipping_cost, return_policy, images, auto_extended_dates, rejected_bidders, ends_at)
VALUES
((SELECT user_id FROM users WHERE email='seller2@example.com'), 'BuyNow Listing', 'Has buy now price', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Fiction' LIMIT 1), 20.00, 20.00, 1.00, 200.00, 'active', 'new', 0.00, 'no returns', '[]'::jsonb, '[]'::jsonb, NULL, now() + interval '7 days');

-- Auto-extend listing (ends soon) to test extension logic
INSERT INTO listings (seller_id, title, description, category_id, subcategory_id, starting_price, current_bid, step_price, buy_now_price, status, item_condition, shipping_cost, return_policy, images, auto_extended_dates, rejected_bidders, ends_at)
VALUES
((SELECT user_id FROM users WHERE email='seller3@example.com'), 'AutoExtend Listing', 'Ends soon to test auto-extend', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Kitchen' LIMIT 1), 5.00, 5.00, 1.00, NULL, 'active', 'new', 0.00, 'no returns', '[]'::jsonb, '[]'::jsonb, now() + interval '4 minutes');

-- Categories
INSERT INTO categories (name, description, icon) VALUES
('Electronics', 'Devices, phones, computers and accessories', 'icon-electronics'),
('Home & Garden', 'Furniture, decor, and garden tools', 'icon-home'),
('Clothing', 'Men and women apparel and accessories', 'icon-clothing'),
('Sports', 'Sporting goods and outdoor equipment', 'icon-sports'),
('Books', 'Books across many genres and formats', 'icon-books');

-- Subcategories
INSERT INTO subcategories (category_id, name) VALUES
((SELECT category_id FROM categories WHERE name='Electronics'), 'Phones'),
((SELECT category_id FROM categories WHERE name='Electronics'), 'Computers'),
((SELECT category_id FROM categories WHERE name='Electronics'), 'Audio'),
((SELECT category_id FROM categories WHERE name='Electronics'), 'Cameras'),
((SELECT category_id FROM categories WHERE name='Electronics'), 'Accessories'),

((SELECT category_id FROM categories WHERE name='Home & Garden'), 'Furniture'),
((SELECT category_id FROM categories WHERE name='Home & Garden'), 'Kitchen'),
((SELECT category_id FROM categories WHERE name='Home & Garden'), 'Garden'),
((SELECT category_id FROM categories WHERE name='Home & Garden'), 'Bedding'),
((SELECT category_id FROM categories WHERE name='Home & Garden'), 'Tools'),

((SELECT category_id FROM categories WHERE name='Clothing'), 'Men'),
((SELECT category_id FROM categories WHERE name='Clothing'), 'Women'),
((SELECT category_id FROM categories WHERE name='Clothing'), 'Kids'),
((SELECT category_id FROM categories WHERE name='Clothing'), 'Shoes'),
((SELECT category_id FROM categories WHERE name='Clothing'), 'Accessories'),

((SELECT category_id FROM categories WHERE name='Sports'), 'Outdoor'),
((SELECT category_id FROM categories WHERE name='Sports'), 'Gym'),
((SELECT category_id FROM categories WHERE name='Sports'), 'Team Sports'),
((SELECT category_id FROM categories WHERE name='Sports'), 'Cycling'),
((SELECT category_id FROM categories WHERE name='Sports'), 'Water Sports'),

((SELECT category_id FROM categories WHERE name='Books'), 'Fiction'),
((SELECT category_id FROM categories WHERE name='Books'), 'Non-Fiction'),
((SELECT category_id FROM categories WHERE name='Books'), 'Textbooks'),
((SELECT category_id FROM categories WHERE name='Books'), 'Comics'),
((SELECT category_id FROM categories WHERE name='Books'), 'Children');

-- Users
INSERT INTO users (email, password_hash, name, avatar_url, role, seller_approved, address, birthday)
VALUES
('buyer1@example.com', crypt('password123', gen_salt('bf', 10)), 'Buyer One', 'https://example.com/avatars/buyer1.jpg', 'buyer', FALSE, '123 Buyer St', '1990-01-01'),
('buyer2@example.com', crypt('password123', gen_salt('bf', 10)), 'Buyer Two', 'https://example.com/avatars/buyer2.jpg', 'buyer', FALSE, '124 Buyer St', '1991-02-02'),
('buyer3@example.com', crypt('password123', gen_salt('bf', 10)), 'Buyer Three', 'https://example.com/avatars/buyer3.jpg', 'buyer', FALSE, '125 Buyer St', '1992-03-03'),
('buyer4@example.com', crypt('password123', gen_salt('bf', 10)), 'Buyer Four', 'https://example.com/avatars/buyer4.jpg', 'buyer', FALSE, '126 Buyer St', '1993-04-04'),
('buyer5@example.com', crypt('password123', gen_salt('bf', 10)), 'Buyer Five', 'https://example.com/avatars/buyer5.jpg', 'buyer', FALSE, '127 Buyer St', '1994-05-05'),

('seller1@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller One', 'https://example.com/avatars/seller1.jpg', 'seller', TRUE, '201 Seller Rd', '1985-06-06'),
('seller2@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Two', 'https://example.com/avatars/seller2.jpg', 'seller', TRUE, '202 Seller Rd', '1986-07-07'),
('seller3@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Three', 'https://example.com/avatars/seller3.jpg', 'seller', TRUE, '203 Seller Rd', '1987-08-08'),
('seller4@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Four', 'https://example.com/avatars/seller4.jpg', 'seller', TRUE, '204 Seller Rd', '1988-09-09'),
('seller5@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Five', 'https://example.com/avatars/seller5.jpg', 'seller', TRUE, '205 Seller Rd', '1989-10-10'),

('admin1@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin One', 'https://example.com/avatars/admin1.jpg', 'admin', FALSE, '301 Admin Ave', '1980-01-01'),
('admin2@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Two', 'https://example.com/avatars/admin2.jpg', 'admin', FALSE, '302 Admin Ave', '1980-02-02'),
('admin3@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Three', 'https://example.com/avatars/admin3.jpg', 'admin', FALSE, '303 Admin Ave', '1980-03-03'),
('admin4@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Four', 'https://example.com/avatars/admin4.jpg', 'admin', FALSE, '304 Admin Ave', '1980-04-04'),
('admin5@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Five', 'https://example.com/avatars/admin5.jpg', 'admin', FALSE, '305 Admin Ave', '1980-05-05');

-- Listings
INSERT INTO listings (seller_id, title, description, category_id, subcategory_id, starting_price, current_bid, step_price, buy_now_price, status, item_condition, shipping_cost, return_policy, images, auto_extended_dates, rejected_bidders, ends_at)
VALUES
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 1', 'Sample description 1', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Phones' LIMIT 1), 10.00, 10.00, 1.00, NULL, 'active', 'new', 0.00, 'no returns', '["https://example.com/images/1-1.jpg","https://example.com/images/1-2.jpg","https://example.com/images/1-3.jpg","https://example.com/images/1-4.jpg","https://example.com/images/1-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '7 days'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 2', 'Sample description 2', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Computers' LIMIT 1), 50.00, 50.00, 5.00, NULL, 'active', 'used', 5.00, '30-day returns', '["https://example.com/images/2-1.jpg","https://example.com/images/2-2.jpg","https://example.com/images/2-3.jpg","https://example.com/images/2-4.jpg","https://example.com/images/2-5.jpg","https://example.com/images/2-6.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '4 days'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 3', 'Sample description 3', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Furniture' LIMIT 1), 100.00, 100.00, 10.00, NULL, 'active', 'used', 15.00, 'no returns', '["https://example.com/images/3-1.jpg","https://example.com/images/3-2.jpg","https://example.com/images/3-3.jpg","https://example.com/images/3-4.jpg","https://example.com/images/3-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '10 days'),
((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 4', 'Sample description 4', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Men' LIMIT 1), 20.00, 20.00, 2.00, NULL, 'active', 'new', 3.00, 'no returns', '["https://example.com/images/4-1.jpg","https://example.com/images/4-2.jpg","https://example.com/images/4-3.jpg","https://example.com/images/4-4.jpg","https://example.com/images/4-5.jpg","https://example.com/images/4-6.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '8 days'),
((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 5', 'Sample description 5', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Outdoor' LIMIT 1), 25.00, 25.00, 2.50, NULL, 'active', 'new', 0.00, 'no returns', '["https://example.com/images/5-1.jpg","https://example.com/images/5-2.jpg","https://example.com/images/5-3.jpg","https://example.com/images/5-4.jpg","https://example.com/images/5-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '5 days'),
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 6', 'Sample description 6', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Fiction' LIMIT 1), 8.00, 8.00, 1.00, NULL, 'active', 'used', 2.00, '30-day returns', '["https://example.com/images/6-1.jpg","https://example.com/images/6-2.jpg","https://example.com/images/6-3.jpg","https://example.com/images/6-4.jpg","https://example.com/images/6-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '6 days'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 7', 'Sample listing 7', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1), 15.00, 15.00, 1.50, NULL, 'active', 'new', 1.00, 'no returns', '["https://example.com/images/7-1.jpg","https://example.com/images/7-2.jpg","https://example.com/images/7-3.jpg","https://example.com/images/7-4.jpg","https://example.com/images/7-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '9 days'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 8', 'Sample listing 8', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Kitchen' LIMIT 1), 60.00, 60.00, 3.00, NULL, 'active', 'new', 10.00, 'no returns', '["https://example.com/images/8-1.jpg","https://example.com/images/8-2.jpg","https://example.com/images/8-3.jpg","https://example.com/images/8-4.jpg","https://example.com/images/8-5.jpg","https://example.com/images/8-6.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '3 days'),
((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 9', 'Sample listing 9', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Women' LIMIT 1), 35.00, 35.00, 2.00, NULL, 'active', 'new', 4.00, 'no returns', '["https://example.com/images/9-1.jpg","https://example.com/images/9-2.jpg","https://example.com/images/9-3.jpg","https://example.com/images/9-4.jpg","https://example.com/images/9-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '11 days'),
((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 10', 'Sample listing 10', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Gym' LIMIT 1), 18.00, 18.00, 1.80, NULL, 'active', 'new', 0.00, 'no returns', '["https://example.com/images/10-1.jpg","https://example.com/images/10-2.jpg","https://example.com/images/10-3.jpg","https://example.com/images/10-4.jpg","https://example.com/images/10-5.jpg","https://example.com/images/10-6.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '12 days'),
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 11', 'Sample listing 11', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Audio' LIMIT 1), 45.00, 45.00, 2.50, NULL, 'active', 'used', 6.00, '30-day returns', '["https://example.com/images/11-1.jpg","https://example.com/images/11-2.jpg","https://example.com/images/11-3.jpg","https://example.com/images/11-4.jpg","https://example.com/images/11-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '2 days'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 12', 'Sample listing 12', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Garden' LIMIT 1), 30.00, 30.00, 3.00, NULL, 'active', 'used', 5.00, 'no returns', '["https://example.com/images/12-1.jpg","https://example.com/images/12-2.jpg","https://example.com/images/12-3.jpg","https://example.com/images/12-4.jpg","https://example.com/images/12-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '7 days'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 13', 'Sample listing 13', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Shoes' LIMIT 1), 55.00, 55.00, 2.50, NULL, 'active', 'new', 8.00, 'no returns', '["https://example.com/images/13-1.jpg","https://example.com/images/13-2.jpg","https://example.com/images/13-3.jpg","https://example.com/images/13-4.jpg","https://example.com/images/13-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '6 days'),
((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 14', 'Sample listing 14', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Cycling' LIMIT 1), 120.00, 120.00, 5.00, NULL, 'active', 'used', 12.00, '30-day returns', '["https://example.com/images/14-1.jpg","https://example.com/images/14-2.jpg","https://example.com/images/14-3.jpg","https://example.com/images/14-4.jpg","https://example.com/images/14-5.jpg","https://example.com/images/14-6.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '9 days'),
((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 15', 'Sample listing 15', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Non-Fiction' LIMIT 1), 12.00, 12.00, 1.00, NULL, 'active', 'new', 1.50, 'no returns', '["https://example.com/images/15-1.jpg","https://example.com/images/15-2.jpg","https://example.com/images/15-3.jpg","https://example.com/images/15-4.jpg","https://example.com/images/15-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '4 days'),
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 16', 'Sample listing 16', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Cameras' LIMIT 1), 75.00, 75.00, 3.00, NULL, 'active', 'used', 7.00, '30-day returns', '["https://example.com/images/16-1.jpg","https://example.com/images/16-2.jpg","https://example.com/images/16-3.jpg","https://example.com/images/16-4.jpg","https://example.com/images/16-5.jpg","https://example.com/images/16-6.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '14 days'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 17', 'Sample listing 17', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Bedding' LIMIT 1), 40.00, 40.00, 4.00, NULL, 'active', 'new', 6.00, 'no returns', '["https://example.com/images/17-1.jpg","https://example.com/images/17-2.jpg","https://example.com/images/17-3.jpg","https://example.com/images/17-4.jpg","https://example.com/images/17-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '10 days'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 18', 'Sample listing 18', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1), 22.00, 22.00, 2.00, NULL, 'active', 'new', 3.00, 'no returns', '["https://example.com/images/18-1.jpg","https://example.com/images/18-2.jpg","https://example.com/images/18-3.jpg","https://example.com/images/18-4.jpg","https://example.com/images/18-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '6 days'),
((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 19', 'Sample listing 19', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Team Sports' LIMIT 1), 16.00, 16.00, 1.50, NULL, 'active', 'new', 2.00, 'no returns', '["https://example.com/images/19-1.jpg","https://example.com/images/19-2.jpg","https://example.com/images/19-3.jpg","https://example.com/images/19-4.jpg","https://example.com/images/19-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '3 days'),
((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 20', 'Sample listing 20', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Textbooks' LIMIT 1), 90.00, 90.00, 5.00, NULL, 'active', 'used', 10.00, '30-day returns', '["https://example.com/images/20-1.jpg","https://example.com/images/20-2.jpg","https://example.com/images/20-3.jpg","https://example.com/images/20-4.jpg","https://example.com/images/20-5.jpg","https://example.com/images/20-6.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '15 days'),
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 21', 'Sample listing 21', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Phones' LIMIT 1), 28.00, 28.00, 1.00, NULL, 'active', 'new', 4.00, 'no returns', '["https://example.com/images/21-1.jpg","https://example.com/images/21-2.jpg","https://example.com/images/21-3.jpg","https://example.com/images/21-4.jpg","https://example.com/images/21-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '7 days'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 22', 'Sample listing 22', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Tools' LIMIT 1), 35.00, 35.00, 2.00, NULL, 'active', 'new', 6.00, 'no returns', '["https://example.com/images/22-1.jpg","https://example.com/images/22-2.jpg","https://example.com/images/22-3.jpg","https://example.com/images/22-4.jpg","https://example.com/images/22-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '9 days'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 23', 'Sample listing 23', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Kids' LIMIT 1), 12.00, 12.00, 1.00, NULL, 'active', 'new', 2.00, 'no returns', '["https://example.com/images/23-1.jpg","https://example.com/images/23-2.jpg","https://example.com/images/23-3.jpg","https://example.com/images/23-4.jpg","https://example.com/images/23-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '5 days'),
((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 24', 'Sample listing 24', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Water Sports' LIMIT 1), 200.00, 200.00, 10.00, NULL, 'active', 'new', 20.00, 'no returns', '["https://example.com/images/24-1.jpg","https://example.com/images/24-2.jpg","https://example.com/images/24-3.jpg","https://example.com/images/24-4.jpg","https://example.com/images/24-5.jpg","https://example.com/images/24-6.jpg","https://example.com/images/24-7.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '20 days'),
((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 25', 'Sample listing 25', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Comics' LIMIT 1), 6.00, 6.00, 1.00, NULL, 'active', 'used', 1.00, 'no returns', '["https://example.com/images/25-1.jpg","https://example.com/images/25-2.jpg","https://example.com/images/25-3.jpg","https://example.com/images/25-4.jpg","https://example.com/images/25-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '2 days'),
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 26', 'Sample listing 26', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Audio' LIMIT 1), 65.00, 65.00, 3.00, NULL, 'active', 'used', 7.00, 'no returns', '["https://example.com/images/26-1.jpg","https://example.com/images/26-2.jpg","https://example.com/images/26-3.jpg","https://example.com/images/26-4.jpg","https://example.com/images/26-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '11 days'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 27', 'Sample listing 27', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Garden' LIMIT 1), 27.00, 27.00, 2.00, NULL, 'active', 'new', 4.00, 'no returns', '["https://example.com/images/27-1.jpg","https://example.com/images/27-2.jpg","https://example.com/images/27-3.jpg","https://example.com/images/27-4.jpg","https://example.com/images/27-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '6 days'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 28', 'Sample listing 28', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1), 14.00, 14.00, 1.00, NULL, 'active', 'new', 2.50, 'no returns', '["https://example.com/images/28-1.jpg","https://example.com/images/28-2.jpg","https://example.com/images/28-3.jpg","https://example.com/images/28-4.jpg","https://example.com/images/28-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '8 days'),
((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 29', 'Sample listing 29', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Cycling' LIMIT 1), 85.00, 85.00, 4.00, NULL, 'active', 'used', 10.00, '30-day returns', '["https://example.com/images/29-1.jpg","https://example.com/images/29-2.jpg","https://example.com/images/29-3.jpg","https://example.com/images/29-4.jpg","https://example.com/images/29-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '4 days'),
((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 30', 'Sample listing 30', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Children' LIMIT 1), 7.00, 7.00, 1.00, NULL, 'active', 'new', 1.00, 'no returns', '["https://example.com/images/30-1.jpg","https://example.com/images/30-2.jpg","https://example.com/images/30-3.jpg","https://example.com/images/30-4.jpg","https://example.com/images/30-5.jpg"]'::jsonb, '[]'::jsonb, NULL, now() + interval '3 days');

-- Bids
INSERT INTO bids (listing_id, bidder_id, amount)
SELECT l.listing_id, b.user_id, (l.starting_price + gs.increment)
FROM listings l
CROSS JOIN LATERAL (VALUES (1),(2),(3),(4),(5)) AS gs(increment)
JOIN users b ON b.email = ('buyer' || ( ( (l.listing_id % 5) + 1 )::text) || '@example.com');

UPDATE bids SET amount = (SELECT l.starting_price + (row_number * l.step_price)
  FROM (
    SELECT listing_id, step_price, (row_number() OVER (PARTITION BY listing_id ORDER BY bid_id)) AS row_number
    FROM bids JOIN listings ON bids.listing_id = listings.listing_id
    WHERE bids.listing_id = listings.listing_id
    LIMIT 1
  ) AS s
  WHERE bids.listing_id = s.listing_id
) WHERE TRUE;

-- Fix listing current_bid to max bid
UPDATE listings SET current_bid = (
  SELECT COALESCE(MAX(amount), listings.starting_price) FROM bids WHERE bids.listing_id = listings.listing_id
);

-- Questions
INSERT INTO listing_questions (listing_id, user_id, question_text, answer_text)
SELECT l.listing_id, u.user_id,
  'Is this item in good condition?', 'Yes, in good condition.'
FROM listings l
JOIN users u ON u.email = ('buyer' || ((l.listing_id % 5) + 1)::text || '@example.com');

INSERT INTO listing_questions (listing_id, user_id, question_text)
SELECT l.listing_id, u.user_id, 'Does it come with original packaging?'
FROM listings l
JOIN users u ON u.email = ('buyer' || (((l.listing_id+1) % 5) + 1)::text || '@example.com');

INSERT INTO listing_questions (listing_id, user_id, question_text)
SELECT l.listing_id, u.user_id, 'Any defects to report?'
FROM listings l
JOIN users u ON u.email = ('buyer' || (((l.listing_id+2) % 5) + 1)::text || '@example.com');

-- Watchlists
INSERT INTO watchlists (user_id, listing_id)
SELECT u.user_id, l.listing_id
FROM users u
CROSS JOIN listings l
WHERE u.email LIKE 'buyer%' AND (l.listing_id % 7 = (substring(u.email from '\\d')::int % 7));

-- Ratings: seed some up/down ratings with comments
INSERT INTO ratings (target_user_id, rater_user_id, rating, role, comment)
VALUES
-- buyers rated sellers
((SELECT user_id FROM users WHERE email='seller1@example.com'), (SELECT user_id FROM users WHERE email='buyer1@example.com'), 1, 'seller', 'Great seller, fast shipping'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), (SELECT user_id FROM users WHERE email='buyer2@example.com'), 1, 'seller', 'Items as described'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), (SELECT user_id FROM users WHERE email='buyer3@example.com'), -1, 'seller', 'Late shipment'),
-- sellers rated buyers
((SELECT user_id FROM users WHERE email='buyer1@example.com'), (SELECT user_id FROM users WHERE email='seller1@example.com'), 1, 'buyer', 'Smooth checkout'),
((SELECT user_id FROM users WHERE email='buyer2@example.com'), (SELECT user_id FROM users WHERE email='seller2@example.com'), -1, 'buyer', 'No communication'),
((SELECT user_id FROM users WHERE email='buyer3@example.com'), (SELECT user_id FROM users WHERE email='seller3@example.com'), 1, 'buyer', 'Prompt payment');

-- Seller requests
INSERT INTO seller_requests (user_id, business_name, business_description, status)
VALUES
((SELECT user_id FROM users WHERE email='buyer1@example.com'), 'Buyer1 Shop', 'I sell vintage items', 'pending'),
((SELECT user_id FROM users WHERE email='buyer2@example.com'), 'Buyer2 Shop', 'Collectibles and more', 'pending'),
((SELECT user_id FROM users WHERE email='buyer3@example.com'), 'Buyer3 Store', 'Handmade crafts', 'rejected');

-- =====
-- Mark some listings as ended and create orders for winning buyers
-- =====
UPDATE listings
SET ends_at = now() - interval '1 day', status = 'sold'
WHERE title IN ('Seed Listing 1', 'Seed Listing 5', 'Seed Listing 12', 'Seed Listing 20');

INSERT INTO orders (listing_id, buyer_id, seller_id, final_price, status, shipping_address)
SELECT l.listing_id,
       (SELECT b.bidder_id FROM bids b WHERE b.listing_id = l.listing_id ORDER BY b.amount DESC LIMIT 1) AS buyer_id,
       l.seller_id,
       l.current_bid,
       'paid',
       '123 Winner St'
FROM listings l
WHERE l.title IN ('Seed Listing 1', 'Seed Listing 5', 'Seed Listing 12', 'Seed Listing 20')
  AND EXISTS (SELECT 1 FROM bids b WHERE b.listing_id = l.listing_id);

UPDATE listings SET status = 'sold'
WHERE listing_id IN (SELECT listing_id FROM orders);

-- Create otps table for verification/reset codes
CREATE TABLE IF NOT EXISTS otps (
  otp_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);