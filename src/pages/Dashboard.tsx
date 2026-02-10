import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wifi, WifiOff, Clock, ArrowRight, Trash2, Smartphone, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const countryCodes = [
  { code: "234", country: "Nigeria" },
  { code: "1", country: "USA" },
  { code: "44", country: "UK" },
  { code: "91", country: "India" },
  { code: "27", country: "South Africa" },
  { code: "254", country: "Kenya" },
  { code: "233", country: "Ghana" },
];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [instances, setInstances] = useState<Tables<"instances">[]>([]);
  const [transactions, setTransactions] = useState<Tables<"transactions">[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("234");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairing, setPairing] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInstanceId, setDeleteInstanceId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"instances" | "transactions" | "plans">("instances");
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    const { data: instData } = await supabase
      .from("instances")
      .select("*")
      .order("created_at", { ascending: false });
    setInstances(instData || []);

    const { data: txnData } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    setTransactions(txnData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else {
        setUser(session.user);
        fetchData();
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else {
        setUser(session.user);
        fetchData();
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, fetchData]);

  const handlePair = async () => {
    if (!phoneNumber || !selectedInstance) return;
    const fullNumber = countryCode + phoneNumber;
    setPairing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("pair-instance", {
        body: { instance_id: selectedInstance, phone_number: fullNumber },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;
      if (data.pairing_code) {
        setPairingCode(data.pairing_code);
        toast({ title: "Pairing code received!", description: `Code: ${data.pairing_code}` });
        fetchData();
      } else {
        throw new Error(data.error || "Failed to get pairing code");
      }
    } catch (err: any) {
      toast({ title: "Pairing failed", description: err.message, variant: "destructive" });
    }
    setPairing(false);
  };

  const handleDelete = async () => {
    if (!deleteInstanceId) return;
    setDeleting(true);
    try {
      const res = await supabase.functions.invoke("delete-instance", {
        body: { instance_id: deleteInstanceId },
      });
      if (res.error) throw new Error(res.error.message);
      toast({ title: "Instance deleted" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  const activeInstances = instances.filter(i => i.status === "active");
  const expiredInstances = instances.filter(i => i.status === "expired");
  const unpaired = instances.filter(i => i.status === "active" && i.phone_number === "pending");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your WhatsApp instances</p>
          </div>
          <Button className="gradient-primary border-0 text-primary-foreground" asChild>
            <Link to="/pricing"><Plus className="mr-2 h-4 w-4" /> New Instance</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Instances", value: instances.length, icon: Wifi },
            { label: "Active", value: activeInstances.length, icon: Wifi },
            { label: "Expired / Deleted", value: instances.filter(i => i.status !== "active").length, icon: WifiOff },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary/50 rounded-lg p-1 w-fit">
          {(["instances", "transactions", "plans"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Instances Tab */}
        {activeTab === "instances" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : instances.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl p-12 border border-border shadow-card text-center">
                <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Wifi className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No instances yet</h3>
                <p className="text-muted-foreground mb-6">Purchase a plan to create your first WhatsApp instance.</p>
                <Button className="gradient-primary border-0 text-primary-foreground shadow-glow" asChild>
                  <Link to="/pricing">View Plans <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </motion.div>
            ) : (
              instances.map((inst, i) => (
                <motion.div key={inst.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${inst.status === "active" ? "gradient-primary" : "bg-muted"}`}>
                      {inst.status === "active" ? <Wifi className="h-5 w-5 text-primary-foreground" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-semibold">{inst.phone_number === "pending" ? "Awaiting Pairing" : `+${inst.phone_number}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.plan_type} · Expires {new Date(inst.expires_at).toLocaleDateString()} · 
                        <span className={`ml-1 font-medium ${inst.status === "active" ? "text-green-600" : "text-destructive"}`}>{inst.status}</span>
                      </p>
                      {inst.pairing_code && <p className="text-xs text-muted-foreground mt-1">Pairing Code: <span className="font-mono font-bold text-primary">{inst.pairing_code}</span></p>}
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {inst.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {inst.status === "active" && inst.phone_number === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => { setSelectedInstance(inst.id); setPairDialogOpen(true); setPairingCode(null); setPhoneNumber(""); }}>
                        <Smartphone className="mr-1 h-4 w-4" /> Pair
                      </Button>
                    )}
                    {inst.status === "active" && (
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setDeleteInstanceId(inst.id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No transactions yet</td></tr>
                  ) : transactions.map(txn => (
                    <tr key={txn.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{new Date(txn.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{txn.plan_type}</td>
                      <td className="px-4 py-3 font-medium">₦{txn.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${txn.status === "success" ? "bg-green-100 text-green-700" : txn.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{txn.payment_reference?.slice(0, 12) || "—"}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="space-y-4">
            {instances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No plan history</div>
            ) : instances.map((inst, i) => (
              <motion.div key={inst.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{inst.plan_type}</p>
                    <p className="text-sm text-muted-foreground">{inst.plan_duration_months} month{inst.plan_duration_months > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inst.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {inst.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(inst.created_at).toLocaleDateString()} → {new Date(inst.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pair Dialog */}
      <Dialog open={pairDialogOpen} onOpenChange={setPairDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pair WhatsApp Number</DialogTitle>
          </DialogHeader>
          {pairingCode ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">Your pairing code:</p>
              <p className="text-4xl font-display font-bold text-gradient mb-4">{pairingCode}</p>
              <p className="text-sm text-muted-foreground">Enter this code in your WhatsApp app to complete pairing.</p>
              <Button variant="outline" className="mt-4" onClick={() => { navigator.clipboard.writeText(pairingCode); toast({ title: "Copied!" }); }}>
                <Copy className="mr-2 h-4 w-4" /> Copy Code
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Country Code</Label>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countryCodes.map(cc => (
                      <SelectItem key={cc.code} value={cc.code}>+{cc.code} ({cc.country})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="8100000000" maxLength={12} />
              </div>
              <p className="text-sm text-muted-foreground">Full number: +{countryCode}{phoneNumber}</p>
              <DialogFooter>
                <Button onClick={handlePair} disabled={pairing || !phoneNumber} className="gradient-primary border-0 text-primary-foreground">
                  {pairing ? "Pairing..." : "Get Pairing Code"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Instance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will disconnect the WhatsApp session and mark the instance as deleted. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Instance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Dashboard;
