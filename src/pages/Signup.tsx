import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Mail, ArrowLeft } from "lucide-react";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("[v0] User already logged in, redirecting to dashboard");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("[v0] Error checking session:", err);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!username || !email || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    
    if (username.length < 3) {
      toast({ title: "Invalid username", description: "Username must be at least 3 characters.", variant: "destructive" });
      return;
    }
    
    if (password.length < 6) {
      toast({ title: "Invalid password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    
    setLoading(true);

    try {
      console.log("[v0] Starting signup for:", email);
      
      // Check if email already exists in profiles
      const { data: existing, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        toast({ title: "Account exists", description: "An account with this email already exists. Please sign in.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if username is taken
      const { data: usernameExists, error: usernameError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (usernameError && usernameError.code !== "PGRST116") {
        throw usernameError;
      }

      if (usernameExists) {
        toast({ title: "Username taken", description: "This username is already in use. Please choose another.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Sign up (user will be unconfirmed)
      console.log("[v0] Creating auth user...");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { username },
        },
      });

      if (error) {
        console.error("[v0] Signup error:", error);
        // Handle "User already registered" from Supabase
        if (error.message?.toLowerCase().includes("already registered")) {
          toast({ title: "Account exists", description: "An account with this email already exists. Please sign in.", variant: "destructive" });
        } else {
          toast({ title: "Signup failed", description: error.message || "Unknown error", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      // Send OTP via custom SMTP
      console.log("[v0] Sending confirmation email...");
      let emailError: any = null;
      
      try {
        const res = await fetch("/api/send-confirmation-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, username }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          emailError = errorData.error || "Failed to send email. Please try again.";
          throw new Error(emailError);
        }

        const data = await res.json();
        if (data?.error) {
          emailError = data.error;
          throw new Error(emailError);
        }
        
        // If we got here, email was sent successfully
        console.log("[v0] Email sent successfully");
        setStep("otp");
        toast({ title: "Check your email!", description: "We sent a 6-digit code to " + email });
        return; // Exit on success
      } catch (smtpErr: any) {
        emailError = smtpErr.message || "Failed to send verification email";
        throw new Error(emailError);
      }
    } catch (err: any) {
      console.error("[v0] Signup error:", err.message || err);
      const errorMessage = err.message || "An unexpected error occurred. Please try again.";
      toast({ 
        title: "Signup Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter a 6-digit code", variant: "destructive" });
      return;
    }
    setVerifying(true);

    try {
      console.log("[v0] Verifying OTP...");
      
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: otpCode }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to verify code");
      }

      const data = await res.json();
      if (data?.error) {
        console.error("[v0] OTP verification failed:", data.error);
        throw new Error(data.error);
      }
      
      // If we got here, OTP was verified
      console.log("[v0] OTP verified successfully");

      console.log("[v0] OTP verified, logging in...");
      // Auto-login
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) {
        console.error("[v0] Login after OTP error:", loginErr);
        throw new Error(loginErr.message || "Login failed");
      }

      console.log("[v0] Logged in successfully");
      toast({ title: "Email verified!", description: "Welcome to WHATMEBOT!" });
      navigate("/pricing");
    } catch (err: any) {
      console.error("[v0] Verification error:", err.message || err);
      const errorMsg = err.message || "Failed to verify code. Please try again.";
      toast({ 
        title: "Verification Failed", 
        description: errorMsg, 
        variant: "destructive" 
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      console.log("[v0] Resending confirmation email...");
      
      const res = await fetch("/api/send-confirmation-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to resend code");
      }

      const data = await res.json();
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast({ title: "Code Resent!", description: "Check your email for a new code." });
    } catch (err: any) {
      console.error("[v0] Resend error:", err.message || err);
      const errorMsg = err.message || "Could not resend code. Please try again.";
      toast({ 
        title: "Resend Failed", 
        description: errorMsg, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md mx-4">
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
            {step === "form" ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-display text-2xl font-bold mb-2">Create Account</h1>
                  <p className="text-sm text-muted-foreground">Get started with WHATMEBOT today</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="your_username" minLength={3} required />
                    <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, and underscores only</p>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
                  </div>
                  <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h1 className="font-display text-2xl font-bold mb-2">Verify Your Email</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <div className="flex justify-center mb-6">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  onClick={handleVerifyOTP}
                  className="w-full gradient-primary border-0 text-primary-foreground"
                  disabled={verifying || otpCode.length !== 6}
                >
                  {verifying ? "Verifying..." : "Verify & Continue"}
                </Button>
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => { setStep("form"); setOtpCode(""); }}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    {loading ? "Sending..." : "Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
