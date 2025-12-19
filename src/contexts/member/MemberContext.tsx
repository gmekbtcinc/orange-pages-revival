// DEPRECATED: This file is maintained for backwards compatibility
// Please use UserContext and useUser instead

export { useUser as useMember, UserProvider as MemberProvider } from "@/contexts/UserContext";

// Re-export for backwards compatibility
// Components using useMember will continue to work, but should migrate to useUser
