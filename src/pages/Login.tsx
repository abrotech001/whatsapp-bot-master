import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: "Missing credentials", description: "Please enter both email and password", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      console.log("[v0] Attempting login for:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("[v0] Login error:", error);
        toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
      } else {
        console.log("[v0] Login successful, redirecting");
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("[v0] Unexpected error during login:", err);
      toast({ title: "Error", description: err.message || "An unexpected error occurred", variant: "destructive" });
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
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold mb-2">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your WHATMEBOT account</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
