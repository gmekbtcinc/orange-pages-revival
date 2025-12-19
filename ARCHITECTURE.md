# Orange Pages Architecture

This document describes the technical architecture of Orange Pages, focusing on the user management system, permission model, and data flow.

## Table of Contents
- [User Management System](#user-management-system)
- [Permission Model](#permission-model)
- [Invitation Flow](#invitation-flow)
- [Data Flow](#data-flow)
- [Table Relationships](#table-relationships)

---

## User Management System

### Overview

Orange Pages uses a multi-table architecture for user management that supports:
- **Multi-company membership**: Users can belong to multiple companies
- **Role-based access**: Different permission levels per company
- **Derived permissions**: Permissions calculated from team role + membership tier
- **Clean separation**: User identity (profiles) separate from company relationships (team_memberships)

### Core Tables

#### `profiles`
User identity table linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, matches auth.users.id |
| email | text | User's email address |
| display_name | text | User's display name |
| title | text | Job title (optional) |
| phone | text | Phone number (optional) |
| avatar_url | text | Profile picture URL |
| bio | text | User biography |
| linkedin_url | text | LinkedIn profile URL |
| twitter_url | text | Twitter/X profile URL |

Created automatically via `handle_new_user_signup_v2` trigger when a user signs up.

#### `team_memberships`
Links users to companies with role-based access.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | References profiles.id |
| business_id | uuid | References businesses.id |
| role | team_role | 'owner', 'admin', or 'member' |
| is_primary | boolean | User's primary company |
| joined_at | timestamp | When user joined the company |
| invited_by | uuid | Profile who invited this user |

#### `invitations`
Pending team invitations with token-based acceptance.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | Company being invited to |
| email | text | Invitee's email |
| role | team_role | Role to assign on acceptance |
| token | uuid | Unique invitation token |
| status | invitation_status | 'pending', 'accepted', 'expired', 'revoked' |
| expires_at | timestamp | Invitation expiration time |
| invited_by | uuid | Profile who sent invitation |

#### `company_leadership`
Public leadership entries displayed on company profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | Company this leader belongs to |
| profile_id | uuid | Optional link to user profile |
| display_name | text | Name to display |
| title | text | Job title |
| headshot_url | text | Photo URL |
| bio | text | Leadership bio |
| is_primary | boolean | Primary contact flag |
| is_visible | boolean | Show on public profile |

---

## Permission Model

### Two-Level Role System

Orange Pages uses a two-level role system:

1. **App Roles** (stored in `user_roles` table)
   - `super_admin`: Full system access
   - `admin`: Administrative access
   - `moderator`: Content moderation access

2. **Team Roles** (stored in `team_memberships` table)
   - `owner`: Full company control, can manage team and transfer ownership
   - `admin`: Can manage team members and edit company profile
   - `member`: Basic access to company features

### Derived Permissions

User permissions are **derived** from their team role and company's membership status:

```typescript
interface UserPermissions {
  // From team role
  can_edit_profile: boolean;      // owner, admin only
  can_manage_team: boolean;       // owner, admin only
  can_manage_leadership: boolean; // owner, admin only
  
  // From membership status (requires active membership)
  can_claim_tickets: boolean;
  can_register_events: boolean;
  can_apply_speaking: boolean;
  can_rsvp_dinners: boolean;
  can_request_resources: boolean;
}
```

### Permission Resolution

```
┌─────────────────────────────────────────────────────────────┐
│                    User Authentication                       │
│                     (Supabase Auth)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      User Profile                            │
│                   (profiles table)                           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   App Roles     │  │ Team Membership │  │ Team Membership │
│  (user_roles)   │  │   Company A     │  │   Company B     │
│                 │  │  role: owner    │  │  role: member   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │                    │
                              ▼                    ▼
                     ┌─────────────────┐  ┌─────────────────┐
                     │   Membership    │  │   Membership    │
                     │   (active)      │  │   (inactive)    │
                     │   tier: gold    │  │   tier: null    │
                     └─────────────────┘  └─────────────────┘
                              │                    │
                              ▼                    ▼
                     ┌─────────────────┐  ┌─────────────────┐
                     │  Full Member    │  │  Limited        │
                     │  Permissions    │  │  Permissions    │
                     └─────────────────┘  └─────────────────┘
```

### Database Functions

Key permission-checking functions:

```sql
-- Check if user is a team member of a company
is_team_member(_profile_id uuid, _business_id uuid) → boolean

-- Check if user is an admin/owner of a company  
is_team_admin(_profile_id uuid, _business_id uuid) → boolean

-- Check if user is a super admin
is_super_admin(_user_id uuid) → boolean

-- Get user's primary company
get_primary_company(_profile_id uuid) → uuid

-- Get full permissions for a user at a company
get_user_permissions(_profile_id uuid, _business_id uuid) → jsonb
```

---

## Invitation Flow

### Sequence Diagram

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Admin  │     │ Backend │     │  Email  │     │ Invitee │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Send Invite   │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ Create        │               │
     │               │ Invitation    │               │
     │               │ Record        │               │
     │               │               │               │
     │               │ Send Email    │               │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │ Click Link    │
     │               │               │<──────────────│
     │               │               │               │
     │               │ Validate      │               │
     │               │ Token         │<──────────────│
     │               │               │               │
     │               │               │ Show Accept   │
     │               │               │ Page          │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ Sign Up /     │
     │               │               │ Login         │
     │               │               │<──────────────│
     │               │               │               │
     │               │ Create        │               │
     │               │ Profile       │               │
     │               │ (trigger)     │               │
     │               │               │               │
     │               │ Accept        │               │
     │               │ Invitation    │<──────────────│
     │               │               │               │
     │               │ Create Team   │               │
     │               │ Membership    │               │
     │               │               │               │
     │               │               │ Redirect to   │
     │               │               │ Dashboard     │
     │               │               │──────────────>│
```

### Implementation Details

1. **Sending Invitation** (`send-team-invitation` edge function)
   - Creates invitation record with unique token
   - Sends email via Resend with accept link
   - Link format: `/invite/accept?token={uuid}`

2. **Accepting Invitation** (`InviteAccept.tsx` page)
   - Validates token and checks expiration
   - If user not logged in: redirects to signup with email pre-filled
   - If user logged in: calls `accept-invitation` edge function

3. **Auto-Accept on Signup** (`handle_new_user_signup_v2` trigger)
   - When new user signs up, checks for pending invitations matching their email
   - Automatically creates team_membership for each pending invitation
   - Marks invitations as accepted

---

## Data Flow

### UserContext Architecture

The `UserContext` is the central state manager for user data:

```typescript
interface UserContextType {
  // Auth state
  user: User | null;              // Supabase auth user
  profile: Profile | null;        // User profile from profiles table
  
  // Company state
  activeCompanyId: string | null; // Currently selected company
  companies: UserCompany[];       // All companies user belongs to
  
  // Membership state
  membership: Membership | null;  // Active company's membership
  
  // Permissions (derived)
  permissions: UserPermissions;   // Calculated permissions
  
  // Admin state
  isAdmin: boolean;               // Has admin role
  isSuperAdmin: boolean;          // Has super_admin role
  
  // Actions
  setActiveCompany: (id: string) => void;
  refreshUserData: () => Promise<void>;
}
```

### Data Fetching Flow

```
1. Auth State Change
        │
        ▼
2. Fetch Profile (profiles table)
        │
        ▼
3. Fetch Team Memberships (team_memberships table)
        │
        ▼
4. Fetch Company Details for each membership
        │
        ▼
5. Set Active Company (primary or first)
        │
        ▼
6. Fetch Membership for Active Company
        │
        ▼
7. Calculate Permissions
        │
        ▼
8. Check Admin Roles (user_roles table)
```

---

## Table Relationships

### Entity Relationship Diagram

```
                            ┌──────────────┐
                            │  auth.users  │
                            │  (Supabase)  │
                            └──────┬───────┘
                                   │ 1:1
                                   ▼
                            ┌──────────────┐
                            │   profiles   │
                            └──────┬───────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           │ 1:N                   │ 1:N                   │ 1:N
           ▼                       ▼                       ▼
    ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
    │  user_roles  │       │    team_     │       │ invitations  │
    │              │       │ memberships  │       │ (invited_by) │
    └──────────────┘       └──────┬───────┘       └──────────────┘
                                  │
                                  │ N:1
                                  ▼
                           ┌──────────────┐
                           │  businesses  │
                           └──────┬───────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           │ 1:1                  │ 1:N                  │ 1:N
           ▼                      ▼                      ▼
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │ memberships  │      │   company_   │      │ invitations  │
    │              │      │  leadership  │      │(business_id) │
    └──────────────┘      └──────────────┘      └──────────────┘
```

### Key Relationships

| From | To | Relationship | Description |
|------|-----|--------------|-------------|
| profiles | auth.users | 1:1 | Profile ID matches auth user ID |
| team_memberships | profiles | N:1 | User can have multiple memberships |
| team_memberships | businesses | N:1 | Company can have multiple team members |
| memberships | businesses | 1:1 | One membership per company |
| invitations | businesses | N:1 | Company can have multiple invitations |
| invitations | profiles | N:1 | User can invite multiple people |
| company_leadership | businesses | N:1 | Company can have multiple leaders |
| company_leadership | profiles | N:1 (optional) | Leader may be linked to user |
| user_roles | profiles | N:1 | User can have multiple app roles |

---

## Migration History

For a complete history of database migrations, see [CHANGELOG.md](./CHANGELOG.md).
