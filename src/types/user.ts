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
export type PassType = "ga" | "pro" | "whale" | "custom";
export type EventType = "flagship" | "regional" | "partner";

// Pass type display configuration
export const PASS_TYPE_LABELS: Record<PassType, string> = {
  ga: "General Admission",
  pro: "Pro Pass",
  whale: "Whale Pass",
  custom: "Custom",
};

export const PASS_TYPE_SHORT_LABELS: Record<PassType, string> = {
  ga: "GA",
  pro: "Pro",
  whale: "Whale",
  custom: "Custom",
};

export const PASS_TYPE_COLORS: Record<PassType, string> = {
  ga: "bg-slate-500",
  pro: "bg-blue-500",
  whale: "bg-purple-600",
  custom: "bg-orange-500",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  flagship: "Flagship",
  regional: "Regional",
  partner: "Partner",
};

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
  isAdmin: boolean; // super_admin, admin, or moderator

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

// Extended allocation type with pass types
export interface ExtendedEventAllocation {
  id: string;
  event_id: string;
  tier: MemberTier;
  // Legacy field (deprecated)
  conference_tickets: number | null;
  // New pass type fields
  ga_tickets: number;
  pro_tickets: number;
  whale_tickets: number;
  custom_tickets: number;
  custom_pass_name: string | null;
  // Other allocations
  symposium_seats: number;
  vip_dinner_seats: number;
  created_at: string | null;
}

// Company allocation override
export interface CompanyAllocationOverride {
  id: string;
  business_id: string;
  event_id: string;
  override_mode: "absolute" | "additive";
  ga_tickets_override: number | null;
  pro_tickets_override: number | null;
  whale_tickets_override: number | null;
  custom_tickets_override: number | null;
  custom_pass_name: string | null;
  symposium_seats_override: number | null;
  vip_dinner_seats_override: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Effective allocation (tier defaults merged with any company override)
export interface EffectiveAllocation extends ExtendedEventAllocation {
  has_override: boolean;
  override_reason?: string | null;
  override_mode?: "absolute" | "additive";
}

// Helper to compute effective allocation
export function computeEffectiveAllocation(
  tierAllocation: ExtendedEventAllocation,
  override?: CompanyAllocationOverride | null
): EffectiveAllocation {
  if (!override) {
    return { ...tierAllocation, has_override: false };
  }

  const isAdditive = override.override_mode === "additive";

  return {
    ...tierAllocation,
    ga_tickets: override.ga_tickets_override !== null
      ? (isAdditive ? tierAllocation.ga_tickets + override.ga_tickets_override : override.ga_tickets_override)
      : tierAllocation.ga_tickets,
    pro_tickets: override.pro_tickets_override !== null
      ? (isAdditive ? tierAllocation.pro_tickets + override.pro_tickets_override : override.pro_tickets_override)
      : tierAllocation.pro_tickets,
    whale_tickets: override.whale_tickets_override !== null
      ? (isAdditive ? tierAllocation.whale_tickets + override.whale_tickets_override : override.whale_tickets_override)
      : tierAllocation.whale_tickets,
    custom_tickets: override.custom_tickets_override !== null
      ? (isAdditive ? tierAllocation.custom_tickets + override.custom_tickets_override : override.custom_tickets_override)
      : tierAllocation.custom_tickets,
    custom_pass_name: override.custom_pass_name ?? tierAllocation.custom_pass_name,
    symposium_seats: override.symposium_seats_override !== null
      ? (isAdditive ? tierAllocation.symposium_seats + override.symposium_seats_override : override.symposium_seats_override)
      : tierAllocation.symposium_seats,
    vip_dinner_seats: override.vip_dinner_seats_override !== null
      ? (isAdditive ? tierAllocation.vip_dinner_seats + override.vip_dinner_seats_override : override.vip_dinner_seats_override)
      : tierAllocation.vip_dinner_seats,
    has_override: true,
    override_reason: override.reason,
    override_mode: override.override_mode,
  };
}
