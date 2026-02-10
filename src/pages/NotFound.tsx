import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="font-display text-9xl font-bold text-gradient mb-4">404</h1>
          </motion.div>

          <h2 className="font-display text-4xl font-bold mb-3">Page Not Found</h2>
          <p className="text-lg text-muted-foreground mb-8">
            The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gradient-primary border-0 text-primary-foreground shadow-glow">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <motion.div
            className="mt-16 relative h-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute inset-0 gradient-hero rounded-full blur-3xl"></div>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
