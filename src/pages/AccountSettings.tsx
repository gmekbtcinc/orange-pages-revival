import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { useMember } from "@/contexts/member/MemberContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Trash2, Building2, Shield, Check, X } from "lucide-react";

const profileSchema = z.object({
  display_name: z.string().min(1, "Name is required").max(100),
  title: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const permissionLabels: Record<string, string> = {
  can_claim_tickets: "Claim Tickets",
  can_register_events: "Register Events",
  can_apply_speaking: "Apply Speaking",
  can_edit_profile: "Edit Profile",
  can_manage_users: "Manage Users",
  can_rsvp_dinners: "RSVP Dinners",
  can_request_resources: "Request Resources",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  company_user: "Team Member",
};

export default function AccountSettings() {
  const { companyUser, membership, refetch } = useMember();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Fetch business data separately
  const { data: business } = useQuery({
    queryKey: ["account-business", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return null;
      const { data } = await supabase
        .from("businesses")
        .select("id, name, logo_url")
        .eq("id", companyUser.business_id)
        .maybeSingle();
      return data;
    },
    enabled: !!companyUser?.business_id,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: companyUser?.display_name || "",
      title: companyUser?.title || "",
      phone: companyUser?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const initials = companyUser?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "BF";

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyUser) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${companyUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("business-assets")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("company_users")
        .update({ avatar_url: publicUrl })
        .eq("id", companyUser.id);

      if (updateError) throw updateError;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ["member-context"] });
      toast({ title: "Avatar updated", description: "Your profile photo has been updated" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!companyUser) return;

    try {
      const { error } = await supabase
        .from("company_users")
        .update({ avatar_url: null })
        .eq("id", companyUser.id);

      if (error) throw error;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ["member-context"] });
      toast({ title: "Avatar removed", description: "Your profile photo has been removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!companyUser) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("company_users")
        .update({
          display_name: data.display_name,
          title: data.title || null,
          phone: data.phone || null,
        })
        .eq("id", companyUser.id);

      if (error) throw error;

      await refetch();
      queryClient.invalidateQueries({ queryKey: ["member-context"] });
      toast({ title: "Profile updated", description: "Your information has been saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      passwordForm.reset();
      toast({ title: "Password changed", description: "Your password has been updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const permissions = companyUser ? [
    { key: "can_claim_tickets", value: companyUser.can_claim_tickets },
    { key: "can_register_events", value: companyUser.can_register_events },
    { key: "can_apply_speaking", value: companyUser.can_apply_speaking },
    { key: "can_edit_profile", value: companyUser.can_edit_profile },
    { key: "can_manage_users", value: companyUser.can_manage_users },
    { key: "can_rsvp_dinners", value: companyUser.can_rsvp_dinners },
    { key: "can_request_resources", value: companyUser.can_request_resources },
  ] : [];

  return (
    <DashboardLayout breadcrumbs={[{ label: "Account Settings" }]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Upload a profile photo to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                {companyUser?.avatar_url && (
                  <AvatarImage src={companyUser.avatar_url} alt={companyUser.display_name} />
                )}
                <AvatarFallback className="bg-bitcoin-orange text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAvatar}
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                  </Button>
                  {companyUser?.avatar_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 5MB.
                </p>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your name and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  {...profileForm.register("display_name")}
                  placeholder="Your name"
                />
                {profileForm.formState.errors.display_name && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.display_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={companyUser?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    {...profileForm.register("title")}
                    placeholder="e.g. CEO, Director"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...profileForm.register("phone")}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register("newPassword")}
                  placeholder="••••••••"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  placeholder="••••••••"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Company Affiliation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Affiliation
            </CardTitle>
            <CardDescription>
              Your company association and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {business ? (
              <>
                <div className="flex items-center gap-4">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-12 w-12 rounded-lg object-contain bg-muted"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">{business.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {roleLabels[companyUser?.role || "company_user"]}
                      </Badge>
                      {membership && (
                        <Badge className="bg-bitcoin-orange text-white">
                          BFC Member
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Your Permissions
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {permissions.map(({ key, value }) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 text-sm ${
                          value ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {value ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        {permissionLabels[key]}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                You are not currently associated with any company.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}