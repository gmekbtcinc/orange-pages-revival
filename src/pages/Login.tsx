import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { getProductionUrl } from "@/lib/urlUtils";

// Feature flag to temporarily disable Google Auth
// Set to true when ready to re-enable
const GOOGLE_AUTH_ENABLED = false;

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get URL params for pre-filling and mode selection
  const returnTo = searchParams.get("returnTo") || searchParams.get("redirect") || "/dashboard";
  const prefillEmail = searchParams.get("email") || "";
  const defaultToSignup = searchParams.get("signup") === "true";

  const [isLogin, setIsLogin] = useState(!defaultToSignup);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate(returnTo);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(returnTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, returnTo]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateEmail = () => {
    const result = z.string().email("Please enter a valid email address").safeParse(email);
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return false;
    }
    setErrors({});
    return true;
  };

  const getGoogleErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || "";
    
    if (message.includes("invalid_client") || message.includes("unauthorized")) {
      return "Google sign-in is not configured correctly. Please contact support or try email sign-in.";
    }
    if (message.includes("access_denied")) {
      return "Access was denied. Please try again or use a different Google account.";
    }
    if (message.includes("popup_closed") || message.includes("popup closed")) {
      return "Sign-in was cancelled. Please try again.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }
    if (message.includes("redirect_uri_mismatch")) {
      return "Configuration error. The redirect URL is not authorized.";
    }
    if (message.includes("origin_not_allowed")) {
      return "This domain is not authorized for Google sign-in.";
    }
    
    return error.message || "Failed to sign in with Google. Please try again.";
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getProductionUrl()}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      const errorMessage = getGoogleErrorMessage(error);
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: { email, origin: getProductionUrl() },
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "If an account exists with that email, we've sent a password reset link.",
      });
      setShowResetForm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        // Navigation handled by onAuthStateChange
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getProductionUrl()}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
          },
        });
        if (error) throw error;
        
        // Send welcome email (fire and forget - don't block on errors)
        const displayName = email.split("@")[0];
        supabase.functions.invoke("send-welcome-email", {
          body: { email, displayName, origin: getProductionUrl() },
        }).catch((err) => console.error("Welcome email error:", err));
        
        // With auto-confirm enabled, the user is signed in immediately
        // The onAuthStateChange listener will handle navigation to returnTo
        if (data.session) {
          toast({ 
            title: "Account created!", 
            description: "Welcome to Orange Pages." 
          });
          // Navigation handled by onAuthStateChange
        } else {
          // If no session (email confirmation required), show message
          toast({ 
            title: "Account created!", 
            description: "Check your email for a confirmation link." 
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      } else if (message.includes("User already registered")) {
        // If coming from an invitation and user already exists, switch to login mode
        if (returnTo.includes("invite")) {
          message = "You already have an account. Please sign in with your password.";
          setIsLogin(true);
          toast({
            title: "Account exists",
            description: message,
          });
          return;
        }
        message = "This email is already registered. Please sign in instead.";
        setIsLogin(true);
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Password reset form
  if (showResetForm) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-4">
          <button 
            onClick={() => setShowResetForm(false)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            ← Back to Sign In
          </button>
        </div>
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Send Reset Link
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      {/* Back link */}
      <div className="w-full max-w-md mb-4">
        <a 
          href="/" 
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          ← Back to Orange Pages
        </a>
      </div>
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to access your BFC member dashboard"
              : "Sign up to create your BFC member account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In Button - temporarily disabled via feature flag */}
          {GOOGLE_AUTH_ENABLED && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {isLogin ? "Sign in with Google" : "Sign up with Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
