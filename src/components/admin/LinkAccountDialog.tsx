import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link2, Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LinkAccountDialogProps {
  user: {
    id: string;
    display_name: string;
    email: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkAccountDialog({ user, open, onOpenChange }: LinkAccountDialogProps) {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAuthUser = async () => {
    if (!searchEmail.trim()) return;
    
    setSearching(true);
    setError(null);
    setFoundUserId(null);
    
    // Search for a company_user with this email who HAS a user_id (meaning they have an auth account)
    const { data, error: searchError } = await supabase
      .from("company_users")
      .select("user_id, email")
      .eq("email", searchEmail.trim().toLowerCase())
      .not("user_id", "is", null)
      .maybeSingle();
    
    setSearching(false);
    
    if (searchError) {
      setError("Error searching for user");
      return;
    }
    
    if (data?.user_id) {
      setFoundUserId(data.user_id);
    } else {
      setError(`No authenticated account found for ${searchEmail}. The user may need to sign up first.`);
    }
  };

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!user || !foundUserId) throw new Error("Missing user or auth ID");
      
      const { error } = await supabase
        .from("company_users")
        .update({ 
          user_id: foundUserId, 
          accepted_at: new Date().toISOString() 
        })
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success("Account linked successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error("Failed to link account: " + error.message);
    },
  });

  const handleClose = () => {
    setSearchEmail("");
    setFoundUserId(null);
    setError(null);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link Auth Account
          </DialogTitle>
          <DialogDescription>
            Manually link an authenticated user account to {user.display_name}'s company record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p><strong>Company User:</strong> {user.display_name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Search by email (of existing authenticated user)</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchAuthUser()}
              />
              <Button onClick={searchAuthUser} disabled={searching || !searchEmail.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {foundUserId && (
            <Alert>
              <AlertDescription>
                Found authenticated account. Click "Link Account" to connect it to this company user record.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => linkMutation.mutate()} 
            disabled={!foundUserId || linkMutation.isPending}
          >
            {linkMutation.isPending ? "Linking..." : "Link Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
