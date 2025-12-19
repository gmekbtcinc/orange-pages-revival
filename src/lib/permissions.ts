import type { TeamRole, MemberTier, UserPermissions } from "@/types/user";
import { DEFAULT_PERMISSIONS } from "@/types/user";

/**
 * Derives user permissions from their team role and membership tier.
 * This centralizes all permission logic - no more boolean flags stored in DB!
 */
export function derivePermissions(
  teamRole: TeamRole | null,
  tier: MemberTier | null,
  isActiveMember: boolean
): UserPermissions {
  // No team role = no permissions
  if (!teamRole) {
    return DEFAULT_PERMISSIONS;
  }

  const isAdmin = teamRole === "owner" || teamRole === "admin";

  // If not an active member, limited permissions
  if (!isActiveMember) {
    return {
      isMember: false,
      teamRole,
      tier: null,
      canClaimTickets: false,
      canRegisterEvents: false,
      canApplySpeaking: false,
      canRsvpDinners: false,
      canRequestResources: false,
      canEditProfile: isAdmin,
      canManageTeam: isAdmin,
      canManageLeadership: isAdmin,
    };
  }

  // Full member permissions
  return {
    isMember: true,
    teamRole,
    tier,
    canClaimTickets: true,
    canRegisterEvents: true,
    canApplySpeaking: true,
    canRsvpDinners: true,
    canRequestResources: true,
    canEditProfile: isAdmin,
    canManageTeam: isAdmin,
    canManageLeadership: isAdmin,
  };
}

/**
 * Check if user has admin-level access to a company
 */
export function isCompanyAdmin(teamRole: TeamRole | null): boolean {
  return teamRole === "owner" || teamRole === "admin";
}

/**
 * Check if user has any team membership
 */
export function hasTeamAccess(teamRole: TeamRole | null): boolean {
  return teamRole !== null;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: MemberTier | null): string {
  if (!tier) return "Free";
  
  const tierNames: Record<MemberTier, string> = {
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    chairman: "Chairman's Circle",
    executive: "Executive",
    industry: "Industry",
    premier: "Premier",
    sponsor: "Sponsor",
  };
  
  return tierNames[tier] || tier;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TeamRole | null): string {
  if (!role) return "None";
  
  const roleNames: Record<TeamRole, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  };
  
  return roleNames[role] || role;
}
