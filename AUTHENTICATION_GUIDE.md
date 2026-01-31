# Authentication & User Management Guide

## Overview

This document explains the authentication system and user management features implemented in Grid World.

## Features

### 1. User Registration & Login

Users can register and login using email/password authentication powered by Supabase Auth.

**Registration Flow:**
1. User clicks on an empty grid without being logged in
2. Authentication modal appears
3. User can register with:
   - Email (required)
   - Password (minimum 6 characters, required)
   - Username (optional - defaults to email prefix)
4. Email verification sent to user's inbox
5. After verification, user can login and purchase grids

**Login Flow:**
1. User enters email and password
2. System validates credentials
3. User profile created/updated in `users` table
4. User redirected to continue their action (e.g., purchasing a grid)

### 2. Protected Actions

The following actions require authentication:

#### Purchasing Empty Grids
- **Before**: Users could click any empty grid and go to purchase page
- **After**:
  - Logged in users: Normal flow continues
  - Not logged in: Auth modal appears
  - After login: User redirected to purchase the selected grid

#### Viewing Own Grids
- **Before**: "My Grids" button showed alert if not logged in
- **After**: Auth modal appears, then navigates to user's grids after login

#### Modifying Grids
- Only grid owners can modify their grids
- Requires active session

### 3. Public Actions (No Auth Required)

Users can browse and view content without logging in:
- ✅ View all grids on the map
- ✅ Click and view photos on occupied grids
- ✅ Navigate around the grid world
- ✅ Use zoom and pan controls
- ✅ View grid details (likes, expiration, etc.)

### 4. Grid Storage Duration

**Maximum Storage**: 366 days (1 year + 1 day)

**How it works:**
- Initial purchase: 30 days storage
- Each like: +1 day storage (up to 366 days max)
- Overflow likes: Still counted but don't extend storage beyond 366 days
- Expired grids: Marked as expired when storage_days ≤ 0

**Example:**
```
Day 0: Purchase grid → 30 days storage
Day 5: Receive 10 likes → 40 days storage
Day 350: Receive 100 likes → 366 days storage (capped)
Day 351: Receive 50 more likes → Still 366 days (overflow ignored)
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: UUID from Supabase Auth (primary key)
- `email`: User's email address (unique)
- `username`: Display name (optional)
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp

### Grids Table Updates

```sql
ALTER TABLE grids
ADD CONSTRAINT grids_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES users(id)
ON DELETE SET NULL;
```

**Changes:**
- `owner_id` now references `users.id` instead of `auth.users.id`
- When user deleted, their grids' `owner_id` set to NULL
- Added index on `owner_id` for faster queries

## Row Level Security (RLS)

### Users Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**Security:**
- Users can only view/edit their own profile
- No user can view other users' profiles
- Automatic profile creation on first login

## Component Architecture

### AuthModal Component

Location: `components/AuthModal.tsx`

**Features:**
- Toggle between login/register modes
- Email validation
- Password strength requirements (min 6 chars)
- Error handling with user-friendly messages
- Success callbacks for post-auth actions
- Responsive design with dark theme

**Props:**
```typescript
interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

**Usage:**
```tsx
<AuthModal
  isOpen={showAuthModal}
  onClose={() => setShowAuthModal(false)}
  onSuccess={handleAuthSuccess}
/>
```

### Integration Points

#### Grids Page (`app/grids/page.tsx`)

**State Management:**
```typescript
const [showAuthModal, setShowAuthModal] = useState(false)
const [pendingPosition, setPendingPosition] = useState<number | null>(null)
```

**Click Handler:**
```typescript
// Empty grid clicked
if (!grid) {
  if (currentUser) {
    router.push(`/upload?position=${position}`)
  } else {
    setPendingPosition(position)
    setShowAuthModal(true)
  }
}
```

**Auth Success Handler:**
```typescript
const handleAuthSuccess = () => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    setCurrentUser(user)
    if (pendingPosition !== null) {
      router.push(`/upload?position=${pendingPosition}`)
      setPendingPosition(null)
    }
  })
}
```

#### Upload Page (`app/upload/page.tsx`)

**URL Parameter Check:**
```typescript
const position = searchParams?.get('position')
if (position && !sessionData.session) {
  setShowAuthModal(true)
}
```

**Grid Click Protection:**
```typescript
onClick={() => {
  if (!grid.user_id && !isAdGrid && !session) {
    setShowAuthModal(true);
    return;
  }
  // Continue with normal flow
}
```

## User Experience Flow

### Scenario 1: New User Purchasing First Grid

1. User visits site (not logged in)
2. Explores grid world freely
3. Clicks empty grid to purchase
4. **Auth modal appears**
5. User registers with email/password
6. Email verification sent
7. User verifies email
8. User logs in
9. **Automatically redirected to purchase page** for selected grid
10. User completes purchase

### Scenario 2: Returning User

1. User visits site
2. Clicks "My Grids" button
3. If not logged in: **Auth modal appears**
4. User logs in
5. **Automatically navigated to their first grid**

### Scenario 3: Browsing Without Account

1. User visits site (not logged in)
2. Can freely:
   - View all grids
   - Click occupied grids to see photos
   - Navigate and zoom
   - See likes and expiration dates
3. When trying to purchase: **Auth modal appears**

## API Endpoints

### Supabase Auth

**Sign Up:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      username: 'username',
    },
  },
})
```

**Sign In:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})
```

**Get Session:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

**Sign Out:**
```typescript
await supabase.auth.signOut()
```

## Error Handling

### Common Errors

**Registration:**
- Invalid email format
- Password too short (< 6 chars)
- Email already registered
- Network errors

**Login:**
- Invalid credentials
- Email not verified
- Account disabled
- Network errors

**Error Display:**
```tsx
{error && (
  <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
    {error}
  </div>
)}
```

## Testing

### Manual Testing Checklist

- [ ] Register new user with valid email/password
- [ ] Register with invalid email (should show error)
- [ ] Register with short password (should show error)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should show error)
- [ ] Click empty grid without login (should show auth modal)
- [ ] Click empty grid with login (should go to purchase)
- [ ] Click "My Grids" without login (should show auth modal)
- [ ] Click "My Grids" with login (should navigate to grids)
- [ ] View occupied grids without login (should work)
- [ ] Verify storage duration caps at 366 days
- [ ] Verify likes beyond 366 days don't extend storage

### Database Testing

```sql
-- Check user creation
SELECT * FROM users WHERE email = 'test@example.com';

-- Check grid ownership
SELECT g.id, g.owner_id, u.email, u.username
FROM grids g
JOIN users u ON g.owner_id = u.id
WHERE u.email = 'test@example.com';

-- Check storage duration
SELECT id, owner_id, storage_days, likes_count
FROM grids
WHERE owner_id IS NOT NULL
ORDER BY storage_days DESC;
```

## Security Considerations

### Password Security
- Minimum 6 characters enforced
- Passwords hashed by Supabase Auth (bcrypt)
- Never stored in plain text

### Session Management
- JWT tokens with expiration
- Automatic token refresh
- Secure HTTP-only cookies

### RLS Policies
- Users can only access their own data
- Grid ownership verified server-side
- No client-side security bypasses

### SQL Injection Prevention
- Parameterized queries via Supabase client
- No raw SQL from user input
- Type-safe TypeScript interfaces

## Future Enhancements

### Planned Features
1. **Social Login**: Google, GitHub OAuth
2. **Password Reset**: Email-based password recovery
3. **Profile Management**: Edit username, avatar
4. **Email Preferences**: Notification settings
5. **Two-Factor Authentication**: Enhanced security
6. **Account Deletion**: GDPR compliance

### Performance Optimizations
1. **Session Caching**: Reduce auth checks
2. **Lazy Loading**: Load user data on demand
3. **Optimistic Updates**: Faster UI feedback

## Troubleshooting

### Issue: Auth modal not appearing
**Solution**: Check `showAuthModal` state and modal component import

### Issue: User not redirected after login
**Solution**: Verify `handleAuthSuccess` callback and `pendingPosition` state

### Issue: "Invalid supabaseUrl" error
**Solution**: Check `.env.local` has correct Supabase credentials

### Issue: RLS policy blocking queries
**Solution**: Verify user session is active and policies are correct

## Migration Guide

### Running Migrations

```bash
# Apply users table migration
supabase db push

# Or manually in Supabase dashboard
# Copy contents of supabase/migrations/20240201_create_users_table.sql
# Run in SQL Editor
```

### Rollback (if needed)

```sql
-- Remove foreign key constraint
ALTER TABLE grids DROP CONSTRAINT IF EXISTS grids_owner_id_fkey;

-- Drop users table
DROP TABLE IF EXISTS users CASCADE;
```

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check Supabase logs in dashboard
4. Verify environment variables are set correctly

---

**Last Updated**: 2024-02-01
**Version**: 1.0.0
