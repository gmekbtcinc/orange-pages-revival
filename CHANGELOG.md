# Changelog

All notable changes to the Orange Pages database schema and architecture.

## [2.0.0] - December 2024

### Major User Architecture Overhaul

This release completely restructures user management to support multi-company membership, cleaner separation of concerns, and derived permissions.

### Added

#### New Tables
- **`profiles`** - User identity table linked to auth.users
  - Stores user profile information (name, email, avatar, bio, social links)
  - Created automatically via trigger when user signs up
  - ID matches auth.users.id for seamless integration

- **`team_memberships`** - User-to-company relationships
  - Supports multiple companies per user
  - Role-based access: `owner`, `admin`, `member`
  - Tracks primary company via `is_primary` flag
  - Records who invited each team member

- **`invitations`** - Token-based team invitations
  - Replaces old `user_invitations` table
  - UUID tokens for secure invitation links
  - Status tracking: `pending`, `accepted`, `expired`, `revoked`
  - 7-day expiration by default

- **`company_leadership`** - Public leadership entries
  - Separate from team membership for public display
  - Optional link to user profile
  - Supports external leaders (no user account)
  - Display order and visibility controls

#### New Database Functions
- `is_team_member(_profile_id, _business_id)` - Check team membership
- `is_team_admin(_profile_id, _business_id)` - Check admin/owner status
- `get_primary_company(_profile_id)` - Get user's primary company
- `get_user_permissions(_profile_id, _business_id)` - Get derived permissions
- `handle_new_user_signup_v2()` - Create profile and auto-accept invitations
- `ensure_single_primary_membership()` - Enforce single primary company
- `auto_link_leadership_by_email()` - Link leadership entries to profiles

#### New Edge Functions
- `send-team-invitation` - Send invitation emails via Resend
- `accept-invitation` - Process invitation acceptance

#### New TypeScript Types
- `Profile` - User profile interface
- `TeamMembership` - Team membership with role
- `UserCompany` - Company with user's role
- `UserPermissions` - Derived permission flags
- `Invitation` - Invitation record

### Changed

#### Updated Tables
- **`ticket_claims`** - Now references `profile_id` instead of user_id
- **`symposium_registrations`** - Now references `profile_id`
- **`speaker_applications`** - Now references `profile_id`
- **`vip_dinner_rsvps`** - Now references `profile_id`
- **`member_resource_requests`** - Now references `profile_id` and `business_id`

#### Updated RLS Policies
- All activity tables now use `profile_id = auth.uid()` checks
- Team-based policies use `is_team_member()` and `is_team_admin()` functions
- Leadership table uses team admin checks for management

#### Updated Components
- `UserContext` - Complete rewrite for new architecture
- `TeamManagement` - Uses new team_memberships table
- `InviteAccept` - New invitation acceptance flow
- `CompanySwitcher` - Support for multiple companies

### Deprecated

- **`company_users`** - Legacy user-company table
  - Still exists for backward compatibility
  - No longer used by application code
  - Will be removed in future version

### Removed

- **`user_invitations`** - Replaced by `invitations` table

### Security

- **Required authentication for business claims**
  - `claimant_user_id` now required (cannot be NULL)
  - Rate limiting enforced per authenticated user
  - Anonymous claims no longer allowed

- **Enhanced RLS policies**
  - All user data queries now require authentication
  - Team membership verified for company access
  - Admin functions use security definer pattern

### Migration Files

The following migrations implement this release:

1. `20251219030259_*.sql` - Create profiles table
2. `20251219030722_*.sql` - Add profile creation trigger
3. `20251219040132_*.sql` - Create team_memberships table
4. `20251219042441_*.sql` - Add team helper functions
5. `20251219043252_*.sql` - Create invitations table
6. `20251219050616_*.sql` - Create company_leadership table
7. `20251219075411_*.sql` - Update activity tables to use profile_id

---

## [1.0.0] - Initial Release

### Core Features
- Business directory with categories
- BFC membership management
- Event management with allocations
- User authentication and roles
- Admin portal

### Tables
- businesses, categories, tags, business_tags
- memberships, membership_tiers, tier_limits
- events, event_allocations
- company_users (now deprecated)
- user_invitations (now removed)
- ticket_claims, symposium_registrations, speaker_applications, vip_dinner_rsvps
- business_claims, business_submissions
- admins, user_roles
