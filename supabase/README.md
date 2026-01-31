# Database Setup Guide

## Prerequisites
- Supabase account and project created
- Supabase CLI installed (optional, for local development)

## Setup Steps

### 1. Environment Variables
Ensure your `.env.local` file has the following Supabase variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run Migration
You have two options to apply the database schema:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL

#### Option B: Using Supabase CLI
```bash
supabase db push
```

### 3. Verify Setup
After running the migration, verify that the following tables exist:
- `users`
- `grids`
- `likes`
- `transactions`
- `reviews`
- `grid_capacity`

## Database Schema Overview

### Tables

#### `users`
Stores user account information and statistics.

#### `grids`
Main table for grid cells. Each row represents one grid cell with:
- Photo URL
- Color (hex code)
- Expiration date
- Moderation status
- Like count

#### `likes`
Tracks user likes on grids. Each like extends the grid's expiration by 1 day (max 9999 days total).

#### `transactions`
Records all payment transactions:
- Purchase ($1)
- Modification ($99)
- Deletion ($99)

#### `reviews`
Stores moderation reviews (both human and AI).

#### `grid_capacity`
Tracks total capacity and occupied count. Automatically expands when >50% filled.

## Key Features

### Automatic Triggers
- **Like Extension**: When a user likes a grid, expiration is extended by 1 day (max 9999 days)
- **Capacity Expansion**: When >50% grids are occupied, capacity increases by 10,000 (max 100M)
- **Updated Timestamps**: Automatically updates `updated_at` fields

### Row Level Security (RLS)
- Users can only view approved and visible grids
- Users can view/edit their own data
- Authenticated users can create grids and likes

## Pricing
- Grid purchase: $1/month
- Modification: $99
- Deletion: $99
- Likes: Free (extends expiration)
