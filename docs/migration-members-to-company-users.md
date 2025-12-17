# Members → Company Users Migration Summary

**Date:** December 17, 2025  
**Purpose:** Consolidate user identity from the `members` table to the `company_users` table as the single source of truth.

## Background

The application previously had two overlapping user identity tables:
- `members` - Original table linking auth users to businesses with tier information
- `company_users` - Newer table for team management with granular permissions

This created confusion about which ID to use for activity tracking and complicated queries.

## Migration Phases Completed

### Phase 1: Schema Preparation
- Made `company_user_id` columns nullable on activity tables to allow gradual migration
- Tables affected: `ticket_claims`, `symposium_registrations`, `speaker_applications`, `vip_dinner_rsvps`, `member_resource_requests`

### Phase 2: MemberContext Update
- Updated `MemberContext.tsx` to expose `companyUser` as the primary identity
- Added `companyUserId` convenience property for activity operations
- Membership tier information now fetched via `companyUser.business_id` → `memberships` table

### Phase 3A: Read Operations Migration
- Updated all SELECT queries to use `company_user_id` instead of `member_id`
- Components updated:
  - `WelcomeHeader.tsx`
  - `TicketProgress.tsx`
  - `TicketClaimModule.tsx`
  - `SymposiumModule.tsx`
  - `SpeakingModule.tsx`
  - `VipDinnerModule.tsx`
  - `MemberResources.tsx`

### Phase 3B: Write Operations Migration
- Updated all INSERT statements to write only to `company_user_id`
- Removed `member_id` from insert payloads in:
  - `ClaimTicketModal.tsx`
  - `SymposiumRegisterModal.tsx`
  - `VipDinnerRsvpModal.tsx`
  - `SpeakerApplicationModal.tsx`
  - `MemberResources.tsx`

### Phase 4: Column Cleanup
- Dropped all RLS policies referencing `member_id`
- Dropped foreign key constraints on `member_id` columns
- Dropped `member_id` columns from all activity tables
- Created new RLS policies using `company_user_id` exclusively

### Phase 5: Members Table Deprecation
- Removed all references to `members` table from codebase
- Dropped RLS policies on `members` table
- Dropped `members` table from database

## New Data Model

### Primary User Identity: `company_users`
```
company_users
├── id (UUID) - PRIMARY KEY, used for all activity tracking
├── user_id (UUID) - Links to auth.users
├── business_id (UUID) - Links to businesses
├── role (user_role) - super_admin, company_admin, company_user
├── email, display_name, title, phone
├── Permission flags (can_claim_tickets, can_edit_profile, etc.)
└── Audit fields (created_at, updated_at, invited_by, etc.)
```

### Membership Tier Access
```
To get a user's membership tier:
1. Get companyUser from MemberContext
2. Use companyUser.business_id to query memberships table
3. memberships.tier contains the tier (silver, gold, platinum, etc.)
```

### Activity Tables Foreign Key Structure
All activity tables now reference `company_users.id`:
- `ticket_claims.company_user_id` → `company_users.id`
- `symposium_registrations.company_user_id` → `company_users.id`
- `speaker_applications.company_user_id` → `company_users.id`
- `vip_dinner_rsvps.company_user_id` → `company_users.id`
- `member_resource_requests.company_user_id` → `company_users.id`

## RLS Policy Pattern

All activity tables use this RLS pattern:
```sql
-- Users can view/create/update their own records
CREATE POLICY "policy_name" ON public.table_name
FOR [SELECT|INSERT|UPDATE]
USING/WITH CHECK (
  company_user_id IN (
    SELECT id FROM company_users 
    WHERE user_id = auth.uid()
  )
);
```

## MemberContext API

```typescript
const { 
  companyUser,      // Full company_users record
  companyUserId,    // Convenience: companyUser?.id
  membership,       // Membership record with tier
  allocations,      // Event allocations for tier
  isLoading,
  isSuperAdmin,
  refetch,
  signOut 
} = useMember();
```

## Testing Checklist

- [ ] Login as member user
- [ ] Dashboard loads with correct welcome header
- [ ] Ticket progress displays correctly
- [ ] Can claim tickets (writes to company_user_id)
- [ ] Can register for symposium
- [ ] Can apply as speaker
- [ ] Can RSVP to VIP dinner
- [ ] Can request member resources
- [ ] Team management shows correct users
- [ ] Admin portal can view all activity

## Rollback Notes

If rollback is needed, the migration would require:
1. Recreating `members` table with original schema
2. Repopulating from `company_users` data
3. Re-adding `member_id` columns to activity tables
4. Updating all queries back to dual-column pattern

**Recommendation:** Do not rollback - the new structure is cleaner and more maintainable.
