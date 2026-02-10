import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, CreditCard, Wifi, Trash2, Shield, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "instances" | "transactions">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string; label: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const adminCall = useCallback(async (action: string, body?: any) => {
    const method = body ? "POST" : "GET";
    const res = await supabase.functions.invoke(`admin?action=${action}`, {
      method: method as any,
      body: body || undefined,
    });
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [u, i, t] = await Promise.all([
        adminCall("users"),
        adminCall("all-instances"),
        adminCall("all-transactions"),
      ]);
      setUsers(u || []);
      setInstances(i || []);
      setTransactions(t || []);
    } catch (err: any) {
      console.error("Admin fetch error:", err);
    }
    setLoading(false);
  }, [adminCall]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      // Check admin role
      const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" as any });
      if (!data) { navigate("/dashboard"); toast({ title: "Access denied", variant: "destructive" }); return; }
      setIsAdmin(true);
      fetchAll();
    });
  }, [navigate, toast, fetchAll]);

  const handleDeleteUser = async (userId: string) => {
    setProcessing(true);
    try {
      await adminCall("delete-user", { user_id: userId });
      toast({ title: "User deleted" });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
    setDeleteDialog(null);
  };

  const handleUpdateInstance = async (instanceId: string, status: string) => {
    setProcessing(true);
    try {
      await adminCall("update-instance", { instance_id: instanceId, status });
      toast({ title: `Instance ${status}` });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
    setDeleteDialog(null);
  };

  if (!isAdmin || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Full platform management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: users.length, icon: Users },
            { label: "Total Instances", value: instances.length, icon: Wifi },
            { label: "Total Transactions", value: transactions.length, icon: CreditCard },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary/50 rounded-lg p-1 w-fit">
          {(["users", "instances", "transactions"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            {activeTab === "users" && (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">User ID</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                    </tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3 font-mono text-xs">{u.user_id?.slice(0, 12)}...</td>
                          <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteDialog({ type: "user", id: u.user_id, label: u.email })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "instances" && (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                    </tr></thead>
                    <tbody>
                      {instances.map(inst => (
                        <tr key={inst.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{inst.phone_number === "pending" ? "Pending" : `+${inst.phone_number}`}</td>
                          <td className="px-4 py-3 font-mono text-xs">{inst.user_id?.slice(0, 8)}...</td>
                          <td className="px-4 py-3">{inst.plan_type}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inst.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{inst.status}</span>
                          </td>
                          <td className="px-4 py-3">{new Date(inst.expires_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 flex gap-1">
                            {inst.status === "active" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => setDeleteDialog({ type: "expire-instance", id: inst.id, label: inst.phone_number })}>
                                  <Ban className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteDialog({ type: "delete-instance", id: inst.id, label: inst.phone_number })}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
                    </tr></thead>
                    <tbody>
                      {transactions.map(txn => (
                        <tr key={txn.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{new Date(txn.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-mono text-xs">{txn.user_id?.slice(0, 8)}...</td>
                          <td className="px-4 py-3">{txn.plan_type}</td>
                          <td className="px-4 py-3 font-medium">₦{txn.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${txn.status === "success" ? "bg-green-100 text-green-700" : txn.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{txn.status}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{txn.payment_reference?.slice(0, 12) || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteDialog?.type === "user" ? "Delete User" : deleteDialog?.type === "expire-instance" ? "Expire Instance" : "Delete Instance"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to {deleteDialog?.type === "user" ? "permanently delete" : deleteDialog?.type === "expire-instance" ? "expire" : "delete"}{" "}
            <span className="font-medium text-foreground">{deleteDialog?.label}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={processing}
              onClick={() => {
                if (deleteDialog?.type === "user") handleDeleteUser(deleteDialog.id);
                else if (deleteDialog?.type === "expire-instance") handleUpdateInstance(deleteDialog.id, "expired");
                else if (deleteDialog?.type === "delete-instance") handleUpdateInstance(deleteDialog.id, "deleted");
              }}
            >
              {processing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Admin;
