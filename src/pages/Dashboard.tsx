import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Wifi, WifiOff, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
  }, [navigate]);

  if (!user) return null;

  // Placeholder data - will be connected to database later
  const instances: any[] = [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your WhatsApp instances</p>
          </div>
          <Button className="gradient-primary border-0 text-primary-foreground" asChild>
            <Link to="/pricing">
              <Plus className="mr-2 h-4 w-4" /> New Instance
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Instances", value: "0", icon: Wifi },
            { label: "Active", value: "0", icon: Wifi },
            { label: "Expired", value: "0", icon: WifiOff },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Instances */}
        {instances.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl p-12 border border-border shadow-card text-center"
          >
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No instances yet</h3>
            <p className="text-muted-foreground mb-6">Purchase a plan to create your first WhatsApp instance.</p>
            <Button className="gradient-primary border-0 text-primary-foreground shadow-glow" asChild>
              <Link to="/pricing">
                View Plans <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
