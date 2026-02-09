import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold text-gradient">
          WHATMEBOT
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          {user && (
            <>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/profile" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Profile</Link>
            </>
          )}
          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild><Link to="/login">Login</Link></Button>
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground" asChild><Link to="/signup">Get Started</Link></Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-2">
          <Link to="/" className="block py-2 text-sm" onClick={() => setIsOpen(false)}>Home</Link>
          {user && (
            <>
              <Link to="/pricing" className="block py-2 text-sm" onClick={() => setIsOpen(false)}>Pricing</Link>
              <Link to="/dashboard" className="block py-2 text-sm" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link to="/profile" className="block py-2 text-sm" onClick={() => setIsOpen(false)}>Profile</Link>
            </>
          )}
          {user ? (
            <Button variant="outline" size="sm" className="w-full" onClick={() => { handleLogout(); setIsOpen(false); }}>Logout</Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" asChild><Link to="/login" onClick={() => setIsOpen(false)}>Login</Link></Button>
              <Button size="sm" className="gradient-primary border-0 text-primary-foreground" asChild><Link to="/signup" onClick={() => setIsOpen(false)}>Get Started</Link></Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
