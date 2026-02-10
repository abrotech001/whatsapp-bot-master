import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const plans = [
  { name: "Starter", price: 1500, duration: "1 Month", months: 1, features: ["1 WhatsApp Instance", "Group Management", "Chat Commands", "Email Support"] },
  { name: "Pro", price: 5000, duration: "4 Months", months: 4, popular: true, features: ["1 WhatsApp Instance", "Group Management", "Chat Commands", "Priority Support", "Save 17%"] },
  { name: "Annual", price: 18000, duration: "1 Year", months: 12, features: ["1 WhatsApp Instance", "Group Management", "Chat Commands", "Priority Support", "Save 50%"] },
];

const Pricing = () => {
  const [user, setUser] = useState<any>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
  }, [navigate]);

  const handlePurchase = async (plan: typeof plans[0]) => {
    setPurchasing(plan.name);
    try {
      const res = await supabase.functions.invoke("initialize-payment", {
        body: {
          amount: plan.price,
          plan_type: plan.name,
          plan_duration_months: plan.months,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    }
    setPurchasing(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each plan creates one WhatsApp instance. Buy multiple plans for more instances.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-card rounded-2xl p-8 border shadow-card hover:shadow-card-hover transition-all duration-300 ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-primary text-primary-foreground text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.duration}</p>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold">₦{plan.price.toLocaleString()}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "gradient-primary border-0 text-primary-foreground shadow-glow" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasing !== null}
                >
                  {purchasing === plan.name ? "Processing..." : "Choose Plan"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Pricing;
