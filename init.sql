DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS seller_requests CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS auto_bids CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS order_messages CASCADE;

DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TYPE user_role AS ENUM ('bidder', 'seller', 'admin');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'bidder',
  seller_approved BOOLEAN NOT NULL DEFAULT FALSE,
    address TEXT NOT NULL,
    birthday VARCHAR(255),
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
    starting_price DECIMAL(15, 2) NOT NULL,
    current_bid DECIMAL(15, 2) NOT NULL,
    step_price DECIMAL(15, 2) NOT NULL,
    buy_now_price DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL,
    item_condition VARCHAR(50) NOT NULL,
    shipping_cost DECIMAL(15, 2) NOT NULL,
    return_policy TEXT NOT NULL,
    images JSONB NOT NULL,
    auto_extend_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_extended_dates JSONB NOT NULL,
    allow_unrated_bidders BOOLEAN NOT NULL DEFAULT TRUE,
    rejected_bidders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS listings_search_idx ON listings USING GIN (
  to_tsvector('english', title || ' ' || description)
);

-- Bids
CREATE TABLE bids (
    bid_id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    bidder_id INTEGER NOT NULL REFERENCES users(user_id),
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- AutoBids
CREATE TABLE auto_bids (
    auto_bid_id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    max_bid_amount DECIMAL(15, 2) NOT NULL,
    current_bid_amount DECIMAL(15, 2) DEFAULT 0,
    increment_amount DECIMAL(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Orders
CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'shipped', 'delivered', 'completed', 'cancelled');

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    bidder_id INTEGER NOT NULL REFERENCES users(user_id),
    seller_id INTEGER NOT NULL REFERENCES users(user_id),
    final_price DECIMAL(15, 2) NOT NULL,
    status order_status DEFAULT 'pending_payment',
    shipping_address TEXT,
    payment_proof TEXT,
    shipping_proof TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Order chat messages
CREATE TABLE order_messages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
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
CREATE TABLE questions (
    question_id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(listing_id),
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    question_text TEXT NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ratings
CREATE TABLE ratings (
    rating_id SERIAL PRIMARY KEY,
    target_user_id INTEGER NOT NULL REFERENCES users(user_id),
    rater_user_id INTEGER NOT NULL REFERENCES users(user_id),
    rating SMALLINT NOT NULL CHECK (rating IN (1, -1)),
    role VARCHAR(50) NOT NULL CHECK (role IN ('bidder','seller')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- OTPs
CREATE TABLE otps (
  otp_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE listings
  ADD CONSTRAINT listing_start_nonnegative CHECK (starting_price >= 0),
  ADD CONSTRAINT listing_step_positive CHECK (step_price > 0),
  ADD CONSTRAINT listing_current_nonnegative CHECK (current_bid >= 0),
  ADD CONSTRAINT listing_buynow_ge_start CHECK (buy_now_price IS NULL OR buy_now_price >= starting_price);

ALTER TABLE bids
  ADD CONSTRAINT bids_positive_amount CHECK (amount > 0);

-- Seed Data: Categories
INSERT INTO categories (name, description, icon) VALUES
('Electronics', 'Devices, phones, computers and accessories', '📱'),
('Home & Garden', 'Furniture, decor, and garden tools', '🏡'),
('Clothing', 'Men and women apparel and accessories', '👕'),
('Sports', 'Sporting goods and outdoor equipment', '⚽'),
('Books', 'Books across many genres and formats', '📚');

-- Seed Data: Subcategories
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

-- Seed Data: Users
INSERT INTO users (email, password_hash, name, avatar_url, role, seller_approved, address, birthday)
VALUES
('bidder1@example.com', crypt('password123', gen_salt('bf', 10)), 'Bidder One', 'https://example.com/avatars/buyer1.jpg', 'bidder', FALSE, '123 Bidder St', '1990-01-01'),
('bidder2@example.com', crypt('password123', gen_salt('bf', 10)), 'Bidder Two', 'https://example.com/avatars/buyer2.jpg', 'bidder', FALSE, '124 Bidder St', '1991-02-02'),
('bidder3@example.com', crypt('password123', gen_salt('bf', 10)), 'Bidder Three', 'https://example.com/avatars/buyer3.jpg', 'bidder', FALSE, '125 Bidder St', '1992-03-03'),
('bidder4@example.com', crypt('password123', gen_salt('bf', 10)), 'Bidder Four', 'https://example.com/avatars/buyer4.jpg', 'bidder', FALSE, '126 Bidder St', '1993-04-04'),
('bidder5@example.com', crypt('password123', gen_salt('bf', 10)), 'Bidder Five', 'https://example.com/avatars/buyer5.jpg', 'bidder', FALSE, '127 Bidder St', '1994-05-05'),

('seller1@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller One', 'https://example.com/avatars/seller1.jpg', 'seller', TRUE, '201 Seller Rd', '1985-06-06'),
('seller2@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Two', 'https://example.com/avatars/seller2.jpg', 'seller', TRUE, '202 Seller Rd', '1986-07-07'),
('seller3@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Three', 'https://example.com/avatars/seller3.jpg', 'seller', TRUE, '203 Seller Rd', '1987-08-08'),
('seller4@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Four', 'https://example.com/avatars/seller4.jpg', 'seller', TRUE, '204 Seller Rd', '1988-09-09'),
('seller5@example.com', crypt('password123', gen_salt('bf', 10)), 'Seller Five', 'https://example.com/avatars/seller5.jpg', 'seller', TRUE, '205 Seller Rd', '1989-10-10'),

('admin1@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin One', 'https://example.com/avatars/admin1.jpg', 'admin', FALSE, '301 Admin Ave', '1980-01-01'),
('admin2@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Two', 'https://example.com/avatars/admin2.jpg', 'admin', FALSE, '302 Admin Ave', '1980-02-02'),
('admin3@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Three', 'https://example.com/avatars/admin3.jpg', 'admin', FALSE, '303 Admin Ave', '1980-03-03'),
('admin4@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Four', 'https://example.com/avatars/admin4.jpg', 'admin', FALSE, '304 Admin Ave', '1980-04-04'),
('admin5@example.com', crypt('password123', gen_salt('bf', 10)), 'Admin Five', 'https://example.com/avatars/admin5.jpg', 'admin', FALSE, '305 Admin Ave', '1980-05-05'),

('lowbidder@example.com', crypt('password123', gen_salt('bf', 10)), 'Low Bidder', 'https://example.com/avatars/low.jpg', 'bidder', FALSE, '1 Low St', '1995-06-06'),
('highbidder@example.com', crypt('password123', gen_salt('bf', 10)), 'High Bidder', 'https://example.com/avatars/high.jpg', 'bidder', FALSE, '2 High St', '1994-05-05'),
('rejectedbidder@example.com', crypt('password123', gen_salt('bf', 10)), 'Rejected Bidder', 'https://example.com/avatars/rej.jpg', 'bidder', FALSE, '3 Rej St', '1993-04-04');

-- ==========================================
-- ADDED MANUAL TESTING USERS
-- ==========================================
INSERT INTO users (email, password_hash, name, avatar_url, role, seller_approved, address, birthday, is_verified)
VALUES
('bidder@example.com', crypt('password123', gen_salt('bf', 10)), 'Manual Bidder', 'https://loremflickr.com/200/200/human?random=99', 'bidder', FALSE, '99 Manual St', '1995-01-01', TRUE),
('seller@example.com', crypt('password123', gen_salt('bf', 10)), 'Manual Seller', 'https://loremflickr.com/200/200/human?random=100', 'seller', TRUE, '100 Manual Ave', '1990-01-01', TRUE),
('admin@example.com', crypt('password123', gen_salt('bf', 10)), 'Manual Admin', 'https://loremflickr.com/200/200/human?random=101', 'admin', FALSE, '101 Manual Blvd', '1985-01-01', TRUE);


-- Seed Data: Listings
INSERT INTO listings (seller_id, title, description, category_id, subcategory_id, starting_price, current_bid, step_price, buy_now_price, status, item_condition, shipping_cost, return_policy, images, auto_extended_dates, rejected_bidders, ends_at)
VALUES
((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 1', 'Sample description 1', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Phones' LIMIT 1),
 250000, 250000, 25000, NULL, 'active', 'new', 0, 'no returns',
 '["https://loremflickr.com/500/500/smartphone?random=1", "https://loremflickr.com/500/500/smartphone?random=2", "https://loremflickr.com/500/500/mobilephone?random=3"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '7 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 2', 'Sample description 2', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Computers' LIMIT 1),
 1250000, 1250000, 125000, NULL, 'active', 'used', 125000, '30-day returns',
 '["https://loremflickr.com/500/500/laptop?random=4", "https://loremflickr.com/500/500/computer?random=5", "https://loremflickr.com/500/500/tech?random=6"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '4 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 3', 'Sample description 3', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Furniture' LIMIT 1),
 2500000, 2500000, 250000, NULL, 'active', 'used', 375000, 'no returns',
 '["https://loremflickr.com/500/500/furniture?random=7", "https://loremflickr.com/500/500/sofa?random=8", "https://loremflickr.com/500/500/chair?random=9"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '10 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 4', 'Sample description 4', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Men' LIMIT 1),
 500000, 500000, 50000, NULL, 'active', 'new', 75000, 'no returns',
 '["https://loremflickr.com/500/500/menswear?random=10", "https://loremflickr.com/500/500/shirt?random=11", "https://loremflickr.com/500/500/clothing?random=12"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '8 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 5', 'Sample description 5', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Outdoor' LIMIT 1),
 625000, 625000, 62500, NULL, 'active', 'new', 0, 'no returns',
 '["https://loremflickr.com/500/500/camping?random=13", "https://loremflickr.com/500/500/hiking?random=14", "https://loremflickr.com/500/500/outdoor?random=15"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '5 days'),

((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 6', 'Sample description 6', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Fiction' LIMIT 1),
 200000, 200000, 25000, NULL, 'active', 'used', 50000, '30-day returns',
 '["https://loremflickr.com/500/500/book?random=16", "https://loremflickr.com/500/500/novel?random=17", "https://loremflickr.com/500/500/reading?random=18"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '6 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 7', 'Sample listing 7', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1),
 375000, 375000, 37500, NULL, 'active', 'new', 25000, 'no returns',
 '["https://loremflickr.com/500/500/headphones?random=19", "https://loremflickr.com/500/500/cable?random=20", "https://loremflickr.com/500/500/charger?random=21"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '9 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 8', 'Sample listing 8', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Kitchen' LIMIT 1),
 1500000, 1500000, 75000, NULL, 'active', 'new', 250000, 'no returns',
 '["https://loremflickr.com/500/500/kitchen?random=22", "https://loremflickr.com/500/500/cookware?random=23", "https://loremflickr.com/500/500/dishes?random=24"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '3 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 9', 'Sample listing 9', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Women' LIMIT 1),
 875000, 875000, 50000, NULL, 'active', 'new', 100000, 'no returns',
 '["https://loremflickr.com/500/500/dress?random=25", "https://loremflickr.com/500/500/fashion?random=26", "https://loremflickr.com/500/500/womenswear?random=27"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '11 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 10', 'Sample listing 10', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Gym' LIMIT 1),
 450000, 450000, 45000, NULL, 'active', 'new', 0, 'no returns',
 '["https://loremflickr.com/500/500/gym?random=28", "https://loremflickr.com/500/500/dumbbell?random=29", "https://loremflickr.com/500/500/fitness?random=30"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '12 days'),

((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 11', 'Sample listing 11', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Audio' LIMIT 1),
 1125000, 1125000, 62500, NULL, 'active', 'used', 150000, '30-day returns',
 '["https://loremflickr.com/500/500/speaker?random=31", "https://loremflickr.com/500/500/audio?random=32", "https://loremflickr.com/500/500/sound?random=33"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '2 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 12', 'Sample listing 12', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Garden' LIMIT 1),
 750000, 750000, 75000, NULL, 'active', 'used', 125000, 'no returns',
 '["https://loremflickr.com/500/500/garden?random=34", "https://loremflickr.com/500/500/flowers?random=35", "https://loremflickr.com/500/500/plants?random=36"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '7 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 13', 'Sample listing 13', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Shoes' LIMIT 1),
 1375000, 1375000, 62500, NULL, 'active', 'new', 200000, 'no returns',
 '["https://loremflickr.com/500/500/shoes?random=37", "https://loremflickr.com/500/500/sneakers?random=38", "https://loremflickr.com/500/500/footwear?random=39"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '6 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 14', 'Sample listing 14', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Cycling' LIMIT 1),
 3000000, 3000000, 125000, NULL, 'active', 'used', 300000, '30-day returns',
 '["https://loremflickr.com/500/500/bicycle?random=40", "https://loremflickr.com/500/500/cycling?random=41", "https://loremflickr.com/500/500/bike?random=42"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '9 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 15', 'Sample listing 15', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Non-Fiction' LIMIT 1),
 300000, 300000, 25000, NULL, 'active', 'new', 37500, 'no returns',
 '["https://loremflickr.com/500/500/textbook?random=43", "https://loremflickr.com/500/500/library?random=44", "https://loremflickr.com/500/500/study?random=45"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '4 days'),

((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 16', 'Sample listing 16', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Cameras' LIMIT 1),
 1875000, 1875000, 75000, NULL, 'active', 'used', 175000, '30-day returns',
 '["https://loremflickr.com/500/500/camera?random=46", "https://loremflickr.com/500/500/lens?random=47", "https://loremflickr.com/500/500/photography?random=48"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '14 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 17', 'Sample listing 17', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Bedding' LIMIT 1),
 1000000, 1000000, 100000, NULL, 'active', 'new', 150000, 'no returns',
 '["https://loremflickr.com/500/500/bed?random=49", "https://loremflickr.com/500/500/bedroom?random=50", "https://loremflickr.com/500/500/pillow?random=51"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '10 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 18', 'Sample listing 18', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1),
 550000, 550000, 50000, NULL, 'active', 'new', 75000, 'no returns',
 '["https://loremflickr.com/500/500/watch?random=52", "https://loremflickr.com/500/500/jewelry?random=53", "https://loremflickr.com/500/500/handbag?random=54"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '6 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 19', 'Sample listing 19', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Team Sports' LIMIT 1),
 400000, 400000, 37500, NULL, 'active', 'new', 50000, 'no returns',
 '["https://loremflickr.com/500/500/soccer?random=55", "https://loremflickr.com/500/500/basketball?random=56", "https://loremflickr.com/500/500/sports?random=57"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '3 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 20', 'Sample listing 20', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Textbooks' LIMIT 1),
 2250000, 2250000, 125000, NULL, 'active', 'used', 250000, '30-day returns',
 '["https://loremflickr.com/500/500/books?random=58", "https://loremflickr.com/500/500/school?random=59", "https://loremflickr.com/500/500/learning?random=60"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '15 days'),

((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 21', 'Sample listing 21', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Phones' LIMIT 1),
 300000, 300000, 30000, NULL, 'active', 'new', 25000, 'no returns',
 '["https://loremflickr.com/500/500/smartphone?random=61", "https://loremflickr.com/500/500/mobile?random=62", "https://loremflickr.com/500/500/phone?random=63"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '8 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 22', 'Sample listing 22', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Tools' LIMIT 1),
 550000, 550000, 55000, NULL, 'active', 'used', 100000, '30-day returns',
 '["https://loremflickr.com/500/500/tools?random=64", "https://loremflickr.com/500/500/hammer?random=65", "https://loremflickr.com/500/500/workshop?random=66"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '10 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 23', 'Sample listing 23', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Kids' LIMIT 1),
 200000, 200000, 20000, NULL, 'active', 'new', 50000, 'no returns',
 '["https://loremflickr.com/500/500/kids?random=67", "https://loremflickr.com/500/500/children?random=68", "https://loremflickr.com/500/500/clothing?random=69"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '12 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 24', 'Sample listing 24', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Water Sports' LIMIT 1),
 1800000, 1800000, 100000, NULL, 'active', 'used', 200000, '30-day returns',
 '["https://loremflickr.com/500/500/surfing?random=70", "https://loremflickr.com/500/500/swimming?random=71", "https://loremflickr.com/500/500/beach?random=72"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '14 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 25', 'Sample listing 25', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Comics' LIMIT 1),
 150000, 150000, 15000, NULL, 'active', 'used', 30000, 'no returns',
 '["https://loremflickr.com/500/500/comic?random=73", "https://loremflickr.com/500/500/manga?random=74", "https://loremflickr.com/500/500/illustration?random=75"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '9 days'),

((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 26', 'Sample listing 26', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Computers' LIMIT 1),
 2000000, 2000000, 100000, NULL, 'active', 'new', 150000, '30-day returns',
 '["https://loremflickr.com/500/500/desktop?random=76", "https://loremflickr.com/500/500/monitor?random=77", "https://loremflickr.com/500/500/keyboard?random=78"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '11 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 27', 'Sample listing 27', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Kitchen' LIMIT 1),
 800000, 800000, 50000, NULL, 'active', 'new', 75000, 'no returns',
 '["https://loremflickr.com/500/500/blender?random=79", "https://loremflickr.com/500/500/mixer?random=80", "https://loremflickr.com/500/500/appliance?random=81"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '13 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 28', 'Sample listing 28', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Men' LIMIT 1),
 600000, 600000, 50000, NULL, 'active', 'new', 60000, 'no returns',
 '["https://loremflickr.com/500/500/suit?random=82", "https://loremflickr.com/500/500/formal?random=83", "https://loremflickr.com/500/500/menswear?random=84"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '7 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 29', 'Sample listing 29', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Gym' LIMIT 1),
 900000, 900000, 75000, NULL, 'active', 'used', 125000, '30-day returns',
 '["https://loremflickr.com/500/500/weights?random=85", "https://loremflickr.com/500/500/barbell?random=86", "https://loremflickr.com/500/500/workout?random=87"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '8 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 30', 'Sample listing 30', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Children' LIMIT 1),
 180000, 180000, 18000, NULL, 'active', 'new', 25000, 'no returns',
 '["https://loremflickr.com/500/500/storybook?random=88", "https://loremflickr.com/500/500/fairytale?random=89", "https://loremflickr.com/500/500/picture?random=90"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '10 days'),

((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 31', 'Sample listing 31', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Audio' LIMIT 1),
 950000, 950000, 50000, NULL, 'active', 'new', 80000, 'no returns',
 '["https://loremflickr.com/500/500/earbuds?random=91", "https://loremflickr.com/500/500/wireless?random=92", "https://loremflickr.com/500/500/music?random=93"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '12 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 32', 'Sample listing 32', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Furniture' LIMIT 1),
 3200000, 3200000, 150000, NULL, 'active', 'used', 400000, '30-day returns',
 '["https://loremflickr.com/500/500/desk?random=94", "https://loremflickr.com/500/500/office?random=95", "https://loremflickr.com/500/500/workspace?random=96"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '14 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 33', 'Sample listing 33', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Women' LIMIT 1),
 750000, 750000, 60000, NULL, 'active', 'new', 70000, 'no returns',
 '["https://loremflickr.com/500/500/blouse?random=97", "https://loremflickr.com/500/500/skirt?random=98", "https://loremflickr.com/500/500/elegant?random=99"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '9 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 34', 'Sample listing 34', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Outdoor' LIMIT 1),
 1200000, 1200000, 100000, NULL, 'active', 'new', 150000, 'no returns',
 '["https://loremflickr.com/500/500/tent?random=100", "https://loremflickr.com/500/500/camping?random=101", "https://loremflickr.com/500/500/adventure?random=102"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '11 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 35', 'Sample listing 35', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Fiction' LIMIT 1),
 280000, 280000, 25000, NULL, 'active', 'new', 40000, 'no returns',
 '["https://loremflickr.com/500/500/thriller?random=103", "https://loremflickr.com/500/500/mystery?random=104", "https://loremflickr.com/500/500/bestseller?random=105"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '13 days'),

((SELECT user_id FROM users WHERE email='seller1@example.com'), 'Seed Listing 36', 'Sample listing 36', (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Cameras' LIMIT 1),
 2500000, 2500000, 125000, NULL, 'active', 'used', 200000, '30-day returns',
 '["https://loremflickr.com/500/500/dslr?random=106", "https://loremflickr.com/500/500/photo?random=107", "https://loremflickr.com/500/500/professional?random=108"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '7 days'),

((SELECT user_id FROM users WHERE email='seller2@example.com'), 'Seed Listing 37', 'Sample listing 37', (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Garden' LIMIT 1),
 650000, 650000, 50000, NULL, 'active', 'new', 90000, 'no returns',
 '["https://loremflickr.com/500/500/lawnmower?random=109", "https://loremflickr.com/500/500/yard?random=110", "https://loremflickr.com/500/500/outdoor?random=111"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '8 days'),

((SELECT user_id FROM users WHERE email='seller3@example.com'), 'Seed Listing 38', 'Sample listing 38', (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Shoes' LIMIT 1),
 1100000, 1100000, 75000, NULL, 'active', 'new', 80000, 'no returns',
 '["https://loremflickr.com/500/500/boots?random=112", "https://loremflickr.com/500/500/leather?random=113", "https://loremflickr.com/500/500/fashion?random=114"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '10 days'),

((SELECT user_id FROM users WHERE email='seller4@example.com'), 'Seed Listing 39', 'Sample listing 39', (SELECT category_id FROM categories WHERE name='Sports'), (SELECT subcategory_id FROM subcategories WHERE name='Cycling' LIMIT 1),
 3500000, 3500000, 150000, NULL, 'active', 'new', 300000, '30-day returns',
 '["https://loremflickr.com/500/500/mountainbike?random=115", "https://loremflickr.com/500/500/racing?random=116", "https://loremflickr.com/500/500/sport?random=117"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '12 days'),

((SELECT user_id FROM users WHERE email='seller5@example.com'), 'Seed Listing 40', 'Sample listing 40', (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Non-Fiction' LIMIT 1),
 350000, 350000, 30000, NULL, 'active', 'new', 45000, 'no returns',
 '["https://loremflickr.com/500/500/biography?random=118", "https://loremflickr.com/500/500/memoir?random=119", "https://loremflickr.com/500/500/history?random=120"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '14 days'),

-- ==========================================
-- MANUAL TEST LISTINGS
-- ==========================================
(
  (SELECT user_id FROM users WHERE email='seller@example.com'),
  'Manual Test Phone',
  'A phone specifically for manual testing',
  (SELECT category_id FROM categories WHERE name='Electronics'),
  (SELECT subcategory_id FROM subcategories WHERE name='Phones' LIMIT 1),
  100000, 100000, 10000, NULL, 'active', 'new', 0, 'no returns',
  '["https://loremflickr.com/500/500/smartphone?random=101", "https://loremflickr.com/500/500/mobile?random=102", "https://loremflickr.com/500/500/technology?random=103"]'::jsonb,
  '[]'::jsonb, NULL, now() + interval '30 days'
),
(
  (SELECT user_id FROM users WHERE email='seller@example.com'),
  'Manual Test Chair',
  'A comfortable chair for testing',
  (SELECT category_id FROM categories WHERE name='Home & Garden'),
  (SELECT subcategory_id FROM subcategories WHERE name='Furniture' LIMIT 1),
  500000, 500000, 50000, NULL, 'active', 'used', 0, 'no returns',
  '["https://loremflickr.com/500/500/chair?random=104", "https://loremflickr.com/500/500/seat?random=105", "https://loremflickr.com/500/500/furniture?random=106"]'::jsonb,
  '[]'::jsonb, NULL, now() + interval '30 days'
),

(
  (SELECT user_id FROM users WHERE email='seller1@example.com'),
  'Rejected Listing',
  'Seller rejected a bidder for testing',
  (SELECT category_id FROM categories WHERE name='Electronics'),
  (SELECT subcategory_id FROM subcategories WHERE name='Phones' LIMIT 1),
  750000, 750000, 25000, NULL, 'active', 'new', 0, 'no returns',
  '["https://loremflickr.com/500/500/smartphone?random=61", "https://loremflickr.com/500/500/mobile?random=62", "https://loremflickr.com/500/500/tech?random=63"]'::jsonb,
  '[]'::jsonb,
  (SELECT jsonb_build_array((SELECT user_id FROM users WHERE email='rejectedbidder@example.com'))),
  now() + interval '7 days'
),
(
  (SELECT user_id FROM users WHERE email='seller2@example.com'),
  'BuyNow Listing',
  'Has buy now price',
  (SELECT category_id FROM categories WHERE name='Books'),
  (SELECT subcategory_id FROM subcategories WHERE name='Fiction' LIMIT 1),
  500000, 500000, 25000, 5000000, 'active', 'new', 0, 'no returns',
  '["https://loremflickr.com/500/500/novel?random=64", "https://loremflickr.com/500/500/story?random=65", "https://loremflickr.com/500/500/fantasy?random=66"]'::jsonb,
  '[]'::jsonb, NULL,
  now() + interval '7 days'
),
(
  (SELECT user_id FROM users WHERE email='seller3@example.com'),
  'AutoExtend Listing',
  'Ends soon to test auto-extend',
  (SELECT category_id FROM categories WHERE name='Home & Garden'),
  (SELECT subcategory_id FROM subcategories WHERE name='Kitchen' LIMIT 1),
  125000, 125000, 25000, NULL, 'active', 'new', 0, 'no returns',
  '["https://loremflickr.com/500/500/cooking?random=67", "https://loremflickr.com/500/500/chef?random=68", "https://loremflickr.com/500/500/kitchenware?random=69"]'::jsonb,
  '[]'::jsonb, NULL,
  now() + interval '4 minutes'
);


-- Seed Data: Bids
WITH bid_plan AS (
  SELECT
    l.listing_id,
    l.title,
    l.seller_id,
    l.starting_price,
    l.step_price,
    CASE
      WHEN l.title IN ('Seed Listing 1', 'Seed Listing 5', 'Seed Listing 12', 'Seed Listing 20') THEN 5
      WHEN l.title IN ('Manual Test Phone', 'Seed Listing 2') THEN 4
      ELSE (l.listing_id % 6)
    END AS bid_count
  FROM listings l
),
bid_rows AS (
  SELECT
    bp.listing_id,
    bp.seller_id,
    gs.i AS bid_index,
    (bp.starting_price + (gs.i * bp.step_price)) AS amount,
    ('bidder' || (((bp.listing_id + gs.i) % 5) + 1)::text || '@example.com') AS bidder_email
  FROM bid_plan bp
  JOIN LATERAL generate_series(1, bp.bid_count) gs(i) ON true
)
INSERT INTO bids (listing_id, bidder_id, amount)
SELECT
  br.listing_id,
  u.user_id,
  br.amount
FROM bid_rows br
JOIN users u ON u.email = br.bidder_email
WHERE u.user_id <> br.seller_id;

-- ==========================================
-- ADDED MANUAL TESTING BID
-- ==========================================
INSERT INTO bids (listing_id, bidder_id, amount)
VALUES (
    (SELECT listing_id FROM listings WHERE title='Manual Test Phone'),
    (SELECT user_id FROM users WHERE email='bidder@example.com'),
    110000
);

-- Update current_bid for all listings based on seeded bids
UPDATE listings
SET current_bid = (
  SELECT COALESCE(MAX(amount), listings.starting_price)
  FROM bids
  WHERE bids.listing_id = listings.listing_id
);

-- Seed Data: AutoBids
INSERT INTO auto_bids (listing_id, user_id, max_bid_amount, increment_amount)
SELECT 
    l.listing_id,
    u.user_id,
    v.max_amount,
    l.step_price
FROM (VALUES 
    ('Seed Listing 2', 'bidder1@example.com', 2125000.00),
    ('Seed Listing 3', 'bidder2@example.com', 3750000.00),
    ('Seed Listing 6', 'highbidder@example.com', 625000.00),
    ('Seed Listing 10', 'lowbidder@example.com', 550000.00),
    ('Seed Listing 14', 'bidder3@example.com', 3750000.00)
) AS v(title, email, max_amount)
JOIN listings l ON l.title = v.title
JOIN users u ON u.email = v.email;

-- Seed Data: Questions
INSERT INTO questions (listing_id, user_id, question_text, answer_text)
SELECT l.listing_id, u.user_id,
  'Is this item in good condition?', 'Yes, in good condition.'
FROM listings l
JOIN users u ON u.email = ('bidder' || ((l.listing_id % 5) + 1)::text || '@example.com');

INSERT INTO questions (listing_id, user_id, question_text)
SELECT l.listing_id, u.user_id, 'Does it come with original packaging?'
FROM listings l
JOIN users u ON u.email = ('bidder' || (((l.listing_id+1) % 5) + 1)::text || '@example.com');

INSERT INTO questions (listing_id, user_id, question_text)
SELECT l.listing_id, u.user_id, 'Any defects to report?'
FROM listings l
JOIN users u ON u.email = ('bidder' || (((l.listing_id+2) % 5) + 1)::text || '@example.com');

-- Seed Data: Watchlists
INSERT INTO watchlists (user_id, listing_id)
SELECT u.user_id, l.listing_id
FROM users u
CROSS JOIN listings l
WHERE u.email LIKE 'bidder%' AND (l.listing_id % 7 = (substring(u.email from '\d')::int % 7));

-- ==========================================
-- ADDED MANUAL TESTING WATCHLIST
-- ==========================================
INSERT INTO watchlists (user_id, listing_id)
VALUES (
    (SELECT user_id FROM users WHERE email='bidder@example.com'),
    (SELECT listing_id FROM listings WHERE title='Manual Test Chair')
);

-- Seed Data: Ratings
INSERT INTO ratings (target_user_id, rater_user_id, rating, role, comment)
VALUES
((SELECT user_id FROM users WHERE email='seller1@example.com'), (SELECT user_id FROM users WHERE email='bidder1@example.com'), 1, 'seller', 'Great seller, fast shipping'),
((SELECT user_id FROM users WHERE email='seller2@example.com'), (SELECT user_id FROM users WHERE email='bidder2@example.com'), 1, 'seller', 'Items as described'),
((SELECT user_id FROM users WHERE email='seller3@example.com'), (SELECT user_id FROM users WHERE email='bidder3@example.com'), -1, 'seller', 'Late shipment'),
((SELECT user_id FROM users WHERE email='bidder1@example.com'), (SELECT user_id FROM users WHERE email='seller1@example.com'), 1, 'bidder', 'Smooth checkout'),
((SELECT user_id FROM users WHERE email='bidder2@example.com'), (SELECT user_id FROM users WHERE email='seller2@example.com'), -1, 'bidder', 'No communication'),
((SELECT user_id FROM users WHERE email='bidder3@example.com'), (SELECT user_id FROM users WHERE email='seller3@example.com'), 1, 'bidder', 'Prompt payment');

-- Seed Data: Requests
INSERT INTO seller_requests (user_id, business_name, business_description, status)
VALUES
((SELECT user_id FROM users WHERE email='bidder1@example.com'), 'Bidder1 Shop', 'I sell vintage items', 'pending'),
((SELECT user_id FROM users WHERE email='bidder2@example.com'), 'Bidder2 Shop', 'Collectibles and more', 'pending'),
((SELECT user_id FROM users WHERE email='bidder3@example.com'), 'Bidder3 Store', 'Handmade crafts', 'rejected');

-- ==========================================
-- ADDED MANUAL TESTING SELLER REQUEST (APPROVED)
-- ==========================================
INSERT INTO seller_requests (user_id, business_name, business_description, status, reviewed_by, reviewed_at)
VALUES (
    (SELECT user_id FROM users WHERE email='seller@example.com'),
    'Manual Seller Shop',
    'A shop for manual testing purposes',
    'approved',
    (SELECT user_id FROM users WHERE email='admin@example.com'),
    now()
);


-- Seed Data: Orders
UPDATE listings
SET ends_at = now() - interval '1 day', status = 'sold'
WHERE title IN ('Seed Listing 1', 'Seed Listing 5', 'Seed Listing 12', 'Seed Listing 20');

INSERT INTO orders (listing_id, bidder_id, seller_id, final_price, status, shipping_address)
SELECT l.listing_id,
       (SELECT b.bidder_id FROM bids b WHERE b.listing_id = l.listing_id ORDER BY b.amount DESC LIMIT 1) AS bidder_id,
       l.seller_id,
       l.current_bid,
       'paid',
       '123 Winner St'
FROM listings l
WHERE l.title IN ('Seed Listing 1', 'Seed Listing 5', 'Seed Listing 12', 'Seed Listing 20')
  AND EXISTS (SELECT 1 FROM bids b WHERE b.listing_id = l.listing_id);

UPDATE listings SET status = 'sold'
WHERE listing_id IN (SELECT listing_id FROM orders);

-- ==========================================
-- MANUAL DEMO ACCOUNT TEST DATA
-- ==========================================

-- Add listings for Manual Seller (seller@example.com)
INSERT INTO listings (seller_id, title, description, category_id, subcategory_id, starting_price, current_bid, step_price, buy_now_price, status, item_condition, shipping_cost, return_policy, images, auto_extended_dates, rejected_bidders, ends_at)
VALUES
((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Vintage Camera', 'Beautiful vintage camera in excellent condition. Perfect for collectors or photography enthusiasts.', 
 (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Cameras' LIMIT 1),
 500000, 600000, 50000, 1200000, 'active', 'used', 50000, '7-day returns',
 '["https://loremflickr.com/500/500/camera?random=501", "https://loremflickr.com/500/500/vintage?random=502", "https://loremflickr.com/500/500/photography?random=503"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '5 days'),

((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Gaming Chair', 'Ergonomic gaming chair with lumbar support. Barely used, like new condition.', 
 (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Furniture' LIMIT 1),
 800000, 800000, 100000, 1500000, 'active', 'used', 150000, 'no returns',
 '["https://loremflickr.com/500/500/chair?random=504", "https://loremflickr.com/500/500/gaming?random=505", "https://loremflickr.com/500/500/furniture?random=506"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '3 days'),

((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Smartwatch', 'Latest model smartwatch with fitness tracking. Brand new in box.', 
 (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1),
 400000, 500000, 50000, 900000, 'active', 'new', 25000, '30-day returns',
 '["https://loremflickr.com/500/500/smartwatch?random=507", "https://loremflickr.com/500/500/tech?random=508", "https://loremflickr.com/500/500/wearable?random=509"]'::jsonb,
 '[]'::jsonb, NULL, now() + interval '7 days'),

-- Unsold items for Manual Seller (ended auctions with no bids)
((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Laptop (UNSOLD)', 'High-performance laptop. Auction ended without bids.', 
 (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Computers' LIMIT 1),
 1500000, 1500000, 100000, NULL, 'ended', 'used', 100000, '30-day returns',
 '["https://loremflickr.com/500/500/laptop?random=513", "https://loremflickr.com/500/500/computer?random=514", "https://loremflickr.com/500/500/notebook?random=515"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '2 days'),

((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Desk Lamp (UNSOLD)', 'Modern LED desk lamp. No bids received.', 
 (SELECT category_id FROM categories WHERE name='Home & Garden'), (SELECT subcategory_id FROM subcategories WHERE name='Furniture' LIMIT 1),
 250000, 250000, 25000, NULL, 'ended', 'new', 50000, 'no returns',
 '["https://loremflickr.com/500/500/lamp?random=516", "https://loremflickr.com/500/500/lighting?random=517", "https://loremflickr.com/500/500/desk?random=518"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '5 days'),

((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Sneakers (UNSOLD)', 'Running shoes size 42. Auction ended without winner.', 
 (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Shoes' LIMIT 1),
 600000, 600000, 50000, NULL, 'ended', 'new', 75000, '14-day returns',
 '["https://loremflickr.com/500/500/sneakers?random=519", "https://loremflickr.com/500/500/shoes?random=520", "https://loremflickr.com/500/500/running?random=521"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '1 day');

-- Add bids from Manual Bidder (bidder@example.com) on seller's listings
INSERT INTO bids (listing_id, bidder_id, amount)
VALUES
((SELECT listing_id FROM listings WHERE title='Demo Vintage Camera' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 600000),
((SELECT listing_id FROM listings WHERE title='Demo Smartwatch' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 500000),
((SELECT listing_id FROM listings WHERE title='Seed Listing 2' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 1375000);

-- Update current_bid for listings with bidder bids
UPDATE listings SET current_bid = 1375000 WHERE title = 'Seed Listing 2';

-- Add watchlist items for Manual Bidder
INSERT INTO watchlists (listing_id, user_id)
VALUES
((SELECT listing_id FROM listings WHERE title='Demo Gaming Chair' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com')),
((SELECT listing_id FROM listings WHERE title='Seed Listing 3' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com')),
((SELECT listing_id FROM listings WHERE title='Seed Listing 7' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com')),
((SELECT listing_id FROM listings WHERE title='Seed Listing 10' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'));

-- Add seller request for testing (pending approval for admin)
INSERT INTO seller_requests (user_id, business_name, business_description, status)
VALUES
((SELECT user_id FROM users WHERE email='bidder1@example.com'), 'Test Business One', 'A test business pending approval', 'pending'),
((SELECT user_id FROM users WHERE email='bidder2@example.com'), 'Test Business Two', 'Another test business pending approval', 'pending');

-- Add ratings/reviews for Manual Seller
INSERT INTO ratings (target_user_id, rater_user_id, rating, role, comment)
VALUES
((SELECT user_id FROM users WHERE email='seller@example.com'), (SELECT user_id FROM users WHERE email='bidder1@example.com'), 1, 'seller', 'Great seller! Fast shipping and excellent communication.'),
((SELECT user_id FROM users WHERE email='seller@example.com'), (SELECT user_id FROM users WHERE email='bidder2@example.com'), 1, 'seller', 'Product exactly as described. Highly recommended!'),
((SELECT user_id FROM users WHERE email='seller@example.com'), (SELECT user_id FROM users WHERE email='bidder3@example.com'), -1, 'seller', 'Item arrived damaged. Poor packaging.');

-- Add ratings/reviews for Manual Bidder (bidder@example.com)
INSERT INTO ratings (target_user_id, rater_user_id, rating, role, comment)
VALUES
((SELECT user_id FROM users WHERE email='bidder@example.com'), (SELECT user_id FROM users WHERE email='seller@example.com'), 1, 'bidder', 'Excellent bidder! Payment was prompt and communication was great.'),
((SELECT user_id FROM users WHERE email='bidder@example.com'), (SELECT user_id FROM users WHERE email='seller1@example.com'), 1, 'bidder', 'Very professional and quick to pay. Would sell to again!'),
((SELECT user_id FROM users WHERE email='bidder@example.com'), (SELECT user_id FROM users WHERE email='seller2@example.com'), 1, 'bidder', 'Smooth transaction. Highly recommended buyer!');

-- Add questions for demo listings
INSERT INTO questions (listing_id, user_id, question_text, answer_text)
VALUES
((SELECT listing_id FROM listings WHERE title='Demo Vintage Camera' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 'Does this camera come with a case?', 'Yes, it includes the original leather case!'),
((SELECT listing_id FROM listings WHERE title='Demo Gaming Chair' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder2@example.com'), 'What is the weight capacity?', 'Up to 150kg'),
((SELECT listing_id FROM listings WHERE title='Demo Smartwatch' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder3@example.com'), 'Is it waterproof?', NULL);

-- Add a completed/sold listing for Manual Seller with Manual Bidder as winner
INSERT INTO listings (seller_id, title, description, category_id, subcategory_id, starting_price, current_bid, step_price, buy_now_price, status, item_condition, shipping_cost, return_policy, images, auto_extended_dates, rejected_bidders, ends_at)
VALUES
((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Headphones (SOLD)', 'Wireless noise-cancelling headphones. Auction ended.', 
 (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Audio' LIMIT 1),
 300000, 450000, 50000, NULL, 'sold', 'used', 30000, '14-day returns',
 '["https://loremflickr.com/500/500/headphones?random=510", "https://loremflickr.com/500/500/audio?random=511", "https://loremflickr.com/500/500/music?random=512"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '1 day'),

-- Order fulfillment testing items
((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Watch (PENDING PAYMENT)', 'Luxury wristwatch. Waiting for payment proof.', 
 (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1),
 800000, 950000, 50000, NULL, 'sold', 'new', 50000, '30-day returns',
 '["https://loremflickr.com/500/500/watch?random=522", "https://loremflickr.com/500/500/luxury?random=523", "https://loremflickr.com/500/500/timepiece?random=524"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '2 days'),

((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Backpack (PAID)', 'Travel backpack. Payment received, waiting for shipment.', 
 (SELECT category_id FROM categories WHERE name='Clothing'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1),
 350000, 450000, 50000, NULL, 'sold', 'used', 40000, '14-day returns',
 '["https://loremflickr.com/500/500/backpack?random=525", "https://loremflickr.com/500/500/bag?random=526", "https://loremflickr.com/500/500/travel?random=527"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '3 days'),

((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Keyboard (SHIPPED)', 'Mechanical keyboard. Item has been shipped.', 
 (SELECT category_id FROM categories WHERE name='Electronics'), (SELECT subcategory_id FROM subcategories WHERE name='Accessories' LIMIT 1),
 600000, 750000, 50000, NULL, 'sold', 'new', 45000, '30-day returns',
 '["https://loremflickr.com/500/500/keyboard?random=528", "https://loremflickr.com/500/500/mechanical?random=529", "https://loremflickr.com/500/500/typing?random=530"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '4 days'),

((SELECT user_id FROM users WHERE email='seller@example.com'), 'Demo Book Set (DELIVERED)', 'Classic literature collection. Order completed.', 
 (SELECT category_id FROM categories WHERE name='Books'), (SELECT subcategory_id FROM subcategories WHERE name='Fiction' LIMIT 1),
 400000, 550000, 50000, NULL, 'sold', 'used', 60000, '7-day returns',
 '["https://loremflickr.com/500/500/books?random=531", "https://loremflickr.com/500/500/literature?random=532", "https://loremflickr.com/500/500/reading?random=533"]'::jsonb,
 '[]'::jsonb, NULL, now() - interval '10 days');

-- Add winning bid from Manual Bidder on sold listing
INSERT INTO bids (listing_id, bidder_id, amount)
VALUES
((SELECT listing_id FROM listings WHERE title='Demo Headphones (SOLD)' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 450000),
((SELECT listing_id FROM listings WHERE title='Demo Watch (PENDING PAYMENT)' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 950000),
((SELECT listing_id FROM listings WHERE title='Demo Backpack (PAID)' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 450000),
((SELECT listing_id FROM listings WHERE title='Demo Keyboard (SHIPPED)' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 750000),
((SELECT listing_id FROM listings WHERE title='Demo Book Set (DELIVERED)' LIMIT 1), (SELECT user_id FROM users WHERE email='bidder@example.com'), 550000);

-- Add order for the sold listing
INSERT INTO orders (listing_id, bidder_id, seller_id, final_price, status, shipping_address, payment_proof, shipping_proof)
VALUES
((SELECT listing_id FROM listings WHERE title='Demo Headphones (SOLD)' LIMIT 1), 
 (SELECT user_id FROM users WHERE email='bidder@example.com'),
 (SELECT user_id FROM users WHERE email='seller@example.com'),
 450000,
 'paid',
 '99 Manual St',
 'https://loremflickr.com/600/400/receipt?random=601',
 NULL),

-- Pending payment - bidder needs to upload payment proof
((SELECT listing_id FROM listings WHERE title='Demo Watch (PENDING PAYMENT)' LIMIT 1), 
 (SELECT user_id FROM users WHERE email='bidder@example.com'),
 (SELECT user_id FROM users WHERE email='seller@example.com'),
 950000,
 'pending_payment',
 '99 Manual St',
 NULL,
 NULL),

-- Paid - seller needs to upload shipping proof
((SELECT listing_id FROM listings WHERE title='Demo Backpack (PAID)' LIMIT 1), 
 (SELECT user_id FROM users WHERE email='bidder@example.com'),
 (SELECT user_id FROM users WHERE email='seller@example.com'),
 450000,
 'paid',
 '99 Manual St',
 'https://loremflickr.com/600/400/payment?random=602',
 NULL),

-- Shipped - item in transit
((SELECT listing_id FROM listings WHERE title='Demo Keyboard (SHIPPED)' LIMIT 1), 
 (SELECT user_id FROM users WHERE email='bidder@example.com'),
 (SELECT user_id FROM users WHERE email='seller@example.com'),
 750000,
 'shipped',
 '99 Manual St',
 'https://loremflickr.com/600/400/invoice?random=603',
 'https://loremflickr.com/600/400/shipping?random=604'),

-- Delivered - order complete
((SELECT listing_id FROM listings WHERE title='Demo Book Set (DELIVERED)' LIMIT 1), 
 (SELECT user_id FROM users WHERE email='bidder@example.com'),
 (SELECT user_id FROM users WHERE email='seller@example.com'),
 550000,
 'delivered',
 '99 Manual St',
 'https://loremflickr.com/600/400/transaction?random=605',
 'https://loremflickr.com/600/400/delivery?random=606');