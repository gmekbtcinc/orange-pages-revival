import type { Tables, Enums } from "@/integrations/supabase/types";

// Database types
export type Profile = Tables<"profiles">;
export type TeamMembership = Tables<"team_memberships">;
export type Membership = Tables<"memberships">;
export type EventAllocation = Tables<"event_allocations">;
export type Invitation = Tables<"invitations">;
export type Business = Tables<"businesses">;

// Enums
export type TeamRole = "owner" | "admin" | "member";
export type MemberTier = Enums<"member_tier">;
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

// Extended types with relations
export interface TeamMembershipWithBusiness extends TeamMembership {
  businesses: Pick<Business, "id" | "name" | "logo_url"> | null;
}

export interface CompanyContext {
  business: Pick<Business, "id" | "name" | "logo_url" | "is_verified" | "is_bfc_member"> | null;
  membership: Membership | null;
  teamMembership: TeamMembership | null;
  permissions: UserPermissions;
}

// Permissions derived from role + tier
export interface UserPermissions {
  isMember: boolean;
  teamRole: TeamRole | null;
  tier: MemberTier | null;
  
  // Member benefits
  canClaimTickets: boolean;
  canRegisterEvents: boolean;
  canApplySpeaking: boolean;
  canRsvpDinners: boolean;
  canRequestResources: boolean;
  
  // Admin capabilities
  canEditProfile: boolean;
  canManageTeam: boolean;
  canManageLeadership: boolean;
}

// User context state
export interface UserState {
  // Identity
  profile: Profile | null;
  isSuperAdmin: boolean;
  
  // Multi-company support
  companies: TeamMembershipWithBusiness[];
  activeCompanyId: string | null;
  activeCompany: CompanyContext | null;
  
  // Allocations for active company
  allocations: EventAllocation[];
  
  // Loading state
  isLoading: boolean;
}

// Default empty permissions
export const DEFAULT_PERMISSIONS: UserPermissions = {
  isMember: false,
  teamRole: null,
  tier: null,
  canClaimTickets: false,
  canRegisterEvents: false,
  canApplySpeaking: false,
  canRsvpDinners: false,
  canRequestResources: false,
  canEditProfile: false,
  canManageTeam: false,
  canManageLeadership: false,
};
