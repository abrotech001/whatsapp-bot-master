import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference) {
      setStatus("failed");
      return;
    }

    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ reference }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Payment verification failed");
        }

        const data = await res.json();
        if (data.success) {
          setStatus("success");
          toast({ title: "Payment successful!", description: "Your instance has been created." });
        } else {
          throw new Error(data.error || "Verification failed");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("failed");
        toast({ title: "Payment verification failed", description: err.message, variant: "destructive" });
      }
    };

    verify();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card rounded-2xl p-12 shadow-card border border-border text-center max-w-md mx-4">
          {status === "verifying" && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Verifying Payment</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">Your WhatsApp instance has been created. Go to your dashboard to pair it.</p>
              <Button className="gradient-primary border-0 text-primary-foreground" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-6">We couldn't verify your payment. Please try again or contact support.</p>
              <Button variant="outline" onClick={() => navigate("/pricing")}>Try Again</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
