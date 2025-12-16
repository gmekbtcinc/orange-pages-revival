// ============================================
// BFC User Hierarchy Types
// ============================================

export type UserRole = 'super_admin' | 'company_admin' | 'company_user';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type MemberTier = 'silver' | 'gold' | 'platinum' | 'chairman' | 'executive';

// ============================================
// Database Record Types
// ============================================

export interface Admin {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  can_manage_memberships: boolean;
  can_manage_events: boolean;
  can_manage_content: boolean;
  can_manage_admins: boolean;
  can_impersonate: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  business_id: string;
  tier: MemberTier;
  member_since: string;
  renewal_date: string | null;
  next_payment_due: string | null;
  payment_amount_cents: number | null;
  billing_email: string | null;
  billing_contact_name: string | null;
  hubspot_deal_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_active: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  user_id: string | null;
  business_id: string;
  email: string;
  display_name: string;
  title: string | null;
  phone: string | null;
  role: UserRole;
  can_claim_tickets: boolean;
  can_register_events: boolean;
  can_apply_speaking: boolean;
  can_edit_profile: boolean;
  can_manage_users: boolean;
  can_rsvp_dinners: boolean;
  can_request_resources: boolean;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  business_id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  invited_by: string | null;
  is_self_request: boolean;
  can_claim_tickets: boolean;
  can_register_events: boolean;
  can_apply_speaking: boolean;
  can_edit_profile: boolean;
  can_manage_users: boolean;
  can_rsvp_dinners: boolean;
  can_request_resources: boolean;
  status: InviteStatus;
  invite_token: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
}

export interface BusinessClaim {
  id: string;
  business_id: string;
  claimant_user_id: string | null;
  claimant_email: string;
  claimant_name: string;
  claimant_title: string | null;
  claimant_phone: string | null;
  verification_method: string | null;
  verification_notes: string | null;
  supporting_document_url: string | null;
  status: ClaimStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TierLimit {
  tier: MemberTier;
  max_users: number;
  description: string | null;
}

// ============================================
// Permission Checking Utilities
// ============================================

export interface UserPermissions {
  // What the user can do
  canClaimTickets: boolean;
  canRegisterEvents: boolean;
  canApplySpeaking: boolean;
  canEditProfile: boolean;
  canManageUsers: boolean;
  canRsvpDinners: boolean;
  canRequestResources: boolean;

  // Role-based
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isCompanyUser: boolean;

  // Membership status
  isMember: boolean;
  memberTier: MemberTier | null;
}

export const DEFAULT_COMPANY_ADMIN_PERMISSIONS: Partial<CompanyUser> = {
  can_claim_tickets: true,
  can_register_events: true,
  can_apply_speaking: true,
  can_edit_profile: true,
  can_manage_users: true,
  can_rsvp_dinners: true,
  can_request_resources: true,
};

export const DEFAULT_COMPANY_USER_PERMISSIONS: Partial<CompanyUser> = {
  can_claim_tickets: false,
  can_register_events: false,
  can_apply_speaking: false,
  can_edit_profile: false,
  can_manage_users: false,
  can_rsvp_dinners: false,
  can_request_resources: false,
};

// ============================================
// Tier Limits (mirror of DB for client-side checks)
// ============================================

export const TIER_USER_LIMITS: Record<MemberTier, number> = {
  silver: 3,
  gold: 5,
  platinum: 10,
  chairman: -1, // Unlimited
  executive: -1, // Unlimited
};

export const TIER_LABELS: Record<MemberTier, string> = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  chairman: "Chairman's Circle",
  executive: 'Executive',
};

// ============================================
// Feature Flags for UI (what to show/hide)
// ============================================

export interface FeatureAccess {
  // Dashboard sections
  showMemberDashboard: boolean;
  showEventBenefits: boolean;
  showMemberResources: boolean;
  showTeamManagement: boolean;

  // Actions
  canClaimTickets: boolean;
  canViewTicketAllocation: boolean;

  // Upsell triggers
  showUpgradePrompts: boolean;
  showMembershipCTA: boolean;
}

export function getFeatureAccess(
  isMember: boolean,
  isAdmin: boolean,
  permissions: UserPermissions
): FeatureAccess {
  if (isAdmin) {
    return {
      showMemberDashboard: true,
      showEventBenefits: true,
      showMemberResources: true,
      showTeamManagement: true,
      canClaimTickets: true,
      canViewTicketAllocation: true,
      showUpgradePrompts: false,
      showMembershipCTA: false,
    };
  }

  if (isMember) {
    return {
      showMemberDashboard: true,
      showEventBenefits: true,
      showMemberResources: true,
      showTeamManagement: permissions.canManageUsers,
      canClaimTickets: permissions.canClaimTickets,
      canViewTicketAllocation: true,
      showUpgradePrompts: false,
      showMembershipCTA: false,
    };
  }

  // Non-member
  return {
    showMemberDashboard: false,
    showEventBenefits: false, // Show locked/preview state
    showMemberResources: false,
    showTeamManagement: permissions.canManageUsers,
    canClaimTickets: false,
    canViewTicketAllocation: false,
    showUpgradePrompts: true,
    showMembershipCTA: true,
  };
}
