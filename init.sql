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
