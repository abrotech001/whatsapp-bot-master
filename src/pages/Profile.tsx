import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else {
        setUser(session.user);
        setNewEmail(session.user.email || "");
      }
    });
  }, [navigate]);

  const handleUpdateEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Email update requested", description: "Check your new email for confirmation." });
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Success", description: "Password updated." });
      setNewPassword("");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        <h1 className="font-display text-3xl font-bold mb-8">Profile</h1>
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-6">
          <div>
            <Label>User ID</Label>
            <p className="text-sm text-muted-foreground font-mono mt-1">{user.id}</p>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2 mt-1">
              <Input id="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <Button onClick={handleUpdateEmail} disabled={loading || newEmail === user.email} variant="outline">Update</Button>
            </div>
          </div>
          <div>
            <Label htmlFor="password">New Password</Label>
            <div className="flex gap-2 mt-1">
              <Input id="password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
              <Button onClick={handleUpdatePassword} disabled={loading || !newPassword} variant="outline">Update</Button>
            </div>
          </div>
          <div>
            <Label>Account Created</Label>
            <p className="text-sm text-muted-foreground mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
