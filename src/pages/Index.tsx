import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Zap, Users, ArrowRight, Smartphone, Bot, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/ahero-image.jpg";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: Bot, title: "Smart Bot Control", desc: "Manage WhatsApp groups directly from chat commands. No complex dashboards needed." },
  { icon: Shield, title: "Secure Connections", desc: "Your WhatsApp sessions are encrypted and protected with enterprise-grade security." },
  { icon: Zap, title: "Instant Pairing", desc: "Connect your WhatsApp number in seconds with our one-tap pairing system." },
  { icon: Users, title: "Group Management", desc: "Add, remove, promote members and control group settings effortlessly." },
];

const steps = [
  { num: "01", title: "Create Account", desc: "Sign up and choose a plan that fits your needs." },
  { num: "02", title: "Connect WhatsApp", desc: "Enter your number and pair with a unique code." },
  { num: "03", title: "Manage Groups", desc: "Control everything from your dashboard or chat." },
];

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const ctaLink = isLoggedIn ? "/dashboard" : "/signup";
  const ctaText = isLoggedIn ? "Go to Dashboard" : "Get Started";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                🚀 WhatsApp Management Made Easy
              </span>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Control Your <br />
                <span className="text-gradient">WhatsApp Groups</span><br />
                From Anywhere
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                WHATMEBOT lets you connect WhatsApp numbers and manage groups directly from chat. No extra apps, no hassle.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary border-0 text-primary-foreground shadow-glow" asChild>
                  <Link to={ctaLink}>
                    {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-glow">
                <img src={heroImage} alt="WHATMEBOT Dashboard" className="w-full rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl p-4 shadow-card animate-float border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Instance Paired</p>
                    <p className="text-xs text-muted-foreground">+234 815 091 6430</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-gradient">Manage WhatsApp</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make WhatsApp group management effortless.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border group">
                <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Get started in three simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className="text-6xl font-display font-bold text-gradient opacity-30 mb-4">{s.num}</div>
                <h3 className="font-display font-semibold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
            <Button size="lg" className="gradient-primary border-0 text-primary-foreground shadow-glow" asChild>
              <Link to={ctaLink}>
                {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
