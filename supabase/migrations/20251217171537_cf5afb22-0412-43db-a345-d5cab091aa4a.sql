-- Migrate legacy tier values in correct order to avoid unique constraint violations
-- Order matters: do the renames in reverse hierarchy order

-- Step 1: Rename executive → sponsor (must be done first since we'll use executive for platinum)
UPDATE event_allocations SET tier = 'sponsor' WHERE tier = 'executive';
UPDATE memberships SET tier = 'sponsor' WHERE tier = 'executive';

-- Step 2: Rename platinum → executive
UPDATE event_allocations SET tier = 'executive' WHERE tier = 'platinum';
UPDATE memberships SET tier = 'executive' WHERE tier = 'platinum';

-- Step 3: Rename gold → premier
UPDATE event_allocations SET tier = 'premier' WHERE tier = 'gold';
UPDATE memberships SET tier = 'premier' WHERE tier = 'gold';

-- Step 4: Rename silver → industry
UPDATE event_allocations SET tier = 'industry' WHERE tier = 'silver';
UPDATE memberships SET tier = 'industry' WHERE tier = 'silver';