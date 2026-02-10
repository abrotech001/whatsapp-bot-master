import { useState } from "react";
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast({ title: "Invalid username", description: "Username must be at least 3 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Sign up (user will be unconfirmed)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username },
      },
    });

    if (error) {
      setLoading(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }

    // Send OTP via custom SMTP
    try {
      const res = await supabase.functions.invoke("send-confirmation-email", {
        body: { email, username },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;
      if (data?.error) throw new Error(data.error);
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Failed to send verification email", description: err.message, variant: "destructive" });
      return;
    }

    setLoading(false);
    setStep("otp");
    toast({ title: "Check your email!", description: "We sent a 6-digit code to " + email });
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setVerifying(true);

    try {
      const res = await supabase.functions.invoke("verify-otp", {
        body: { email, code: otpCode },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;
      if (data?.error) throw new Error(data.error);

      // Auto-login
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) throw new Error(loginErr.message);

      toast({ title: "Email verified!", description: "Welcome to WHATMEBOT!" });
      navigate("/pricing");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    }

    setVerifying(false);
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("send-confirmation-email", {
        body: { email, username },
      });
      if (res.error) throw new Error(res.error.message);
      toast({ title: "Code resent!", description: "Check your email for a new code." });
    } catch (err: any) {
      toast({ title: "Resend failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
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
