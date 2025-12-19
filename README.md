# Orange Pages - Bitcoin Business Directory & BFC Member Portal

A comprehensive platform for Bitcoin-focused businesses, combining a public business directory ("Orange Pages") with a private member portal for [Bitcoin for Corporations (BFC)](https://bitcoinforcorporations.com) members.

## 🎯 Vision

Orange Pages aims to be the definitive directory of Bitcoin-accepting and Bitcoin-focused businesses worldwide, while providing BFC member companies with exclusive access to conference benefits, networking opportunities, and resources.

## 💼 Business Model

### Freemium Directory
- **Free tier**: Any business can claim their listing, edit basic profile information (name, description, logo, website), and appear in the public directory
- **Paid tier**: BFC membership unlocks conference tickets, symposium access, speaking opportunities, VIP dinners, and team collaboration features

### BFC Membership Tiers
| Tier | Target Audience |
|------|----------------|
| Industry | Bitcoin-native companies |
| Premier | Growing Bitcoin businesses |
| Executive | Enterprise Bitcoin adopters |
| Sponsor | Conference sponsors |
| Chairman's Circle | Strategic partners |

### Revenue Streams
1. **BFC Memberships**: Annual corporate memberships with tiered benefits
2. **Conference Tickets**: Members receive allocated tickets; non-members purchase separately
3. **Sponsorships**: Event and brand sponsorship opportunities

## ✨ Features

### Public Features
- **Business Directory**: Browse Bitcoin businesses by category
- **Business Profiles**: Detailed company pages with descriptions, leadership, social links
- **Category Search**: Filter businesses across 15+ categories
- **Member Carousel**: Featured BFC member companies on homepage

### Free Account Features
- Claim and manage your business listing
- Edit company profile (name, description, logo, contact info)
- View public directory listings

### BFC Member Features
- **Dashboard**: Personalized member portal with tier-based benefits
- **Ticket Claims**: Claim allocated conference tickets for your team
- **Symposium Registration**: Register for exclusive BFC Symposium events
- **Speaking Applications**: Apply to speak at Bitcoin conferences
- **VIP Dinners**: RSVP to exclusive networking dinners
- **Team Management**: Invite team members with granular permissions
- **Company Profile Editor**: Full control over public business listing

### Admin Portal
- **Companies Management**: View, edit, and manage all businesses
- **Memberships Management**: Manage tiers, billing, renewals
- **Users Management**: Manage user accounts and permissions
- **Events Management**: Create events, manage allocations, view registrations
- **Claims Queue**: Review business claims and submissions

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Email/password with auto-confirm
- **Storage**: Supabase Storage for logos and avatars

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/          # Admin portal components
│   ├── claims/         # Business claim components
│   ├── company-profile/# Profile editor components
│   ├── dashboard/      # Member dashboard components
│   ├── modals/         # Modal dialogs (tickets, RSVP, etc.)
│   ├── submissions/    # Business submission components
│   ├── team/           # Team management components
│   └── ui/             # Reusable UI components (shadcn)
├── contexts/
│   └── member/         # Member context provider
├── hooks/              # Custom React hooks
├── integrations/
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
└── pages/
    ├── admin/          # Admin portal pages
    ├── AccountSettings.tsx
    ├── BusinessDetail.tsx
    ├── CompanyProfile.tsx
    ├── Dashboard.tsx
    ├── Index.tsx       # Homepage
    ├── Login.tsx
    └── TeamManagement.tsx
```

## 🗄 Database Schema

### User & Team Tables
- `profiles` - User profiles (linked to auth.users via id)
- `team_memberships` - User-to-company associations with roles (owner/admin/member)
- `invitations` - Team member invitations with token-based acceptance
- `company_leadership` - Public leadership entries for company profiles

### Business Tables
- `businesses` - Company listings with profiles
- `categories` - Business categories
- `memberships` - BFC membership records with tiers
- `business_claims` - Ownership claim requests
- `business_submissions` - New business submissions

### Event Tables
- `events` - Conferences and events
- `event_allocations` - Tier-based benefit allocations per event
- `ticket_claims` - Conference ticket claims (references profile_id)
- `symposium_registrations` - Symposium attendance (references profile_id)
- `speaker_applications` - Speaking slot applications (references profile_id)
- `vip_dinner_rsvps` - VIP dinner reservations (references profile_id)
- `member_resource_requests` - Resource/support requests (references profile_id)

### Supporting Tables
- `admins` - Admin user records
- `user_roles` - App-level role-based access control (super_admin, admin, moderator)

### Deprecated Tables
- `company_users` - Legacy user-company table (replaced by profiles + team_memberships)

## 🔐 Security

- **Row Level Security (RLS)**: All tables protected with granular policies
- **Multi-tier Role System**:
  - App roles: `super_admin`, `admin`, `moderator` (in `user_roles` table)
  - Team roles: `owner`, `admin`, `member` (in `team_memberships` table)
- **Derived Permissions**: User permissions derived from team role + membership tier
- **Tier-based Benefits**: Member benefits determined by active membership tier
- **Multi-company Support**: Users can belong to multiple companies via team_memberships

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
The following are automatically configured via Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## 📱 Routes

### Public Routes
- `/` - Homepage with directory and member carousel
- `/business/:id` - Business detail page
- `/login` - Authentication page

### Member Routes (Protected)
- `/dashboard` - Member dashboard
- `/dashboard/company-profile` - Edit company profile
- `/dashboard/team` - Team management
- `/dashboard/account` - Account settings

### Admin Routes (Admin Only)
- `/admin` - Admin dashboard
- `/admin/companies` - Companies management
- `/admin/companies/:id` - Company detail
- `/admin/memberships` - Memberships management
- `/admin/users` - Users management
- `/admin/events` - Events management
- `/admin/events/:id` - Event detail
- `/admin/claims` - Claims queue

## 🎨 Design System

The application uses a unified light theme with Bitcoin-orange accents:
- **Primary**: Bitcoin Orange (#F7931A)
- **Background**: Light/white surfaces
- **Components**: shadcn/ui with custom variants
- **Typography**: System fonts with clear hierarchy

## 📄 License

Proprietary - Bitcoin for Corporations

## 🔗 Links

- [Bitcoin for Corporations](https://bitcoinforcorporations.com)
- [Bitcoin Magazine](https://bitcoinmagazine.com)
- [Bitcoin Conference](https://b.tc)
