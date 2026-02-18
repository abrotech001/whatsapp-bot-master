# Alternative: Skip Email Verification (Testing/Development)

If you want to test the app quickly without setting up SMTP, you can temporarily modify the signup flow to skip email verification.

## Quick Fix for Development

### Option 1: Simple Email Verification (No SMTP)

Replace the signup flow to use Supabase's built-in email confirmation instead of custom OTP:

**File: `src/pages/Signup.tsx`**

Change the signup handler to this simpler version:

```typescript
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation
  if (!username || !email || !password) {
    toast({ title: "Missing fields", description: "Please fill in all fields", variant: "destructive" });
    return;
  }
  
  if (username.length < 3) {
    toast({ title: "Invalid username", description: "Username must be at least 3 characters.", variant: "destructive" });
    return;
  }
  
  if (password.length < 6) {
    toast({ title: "Invalid password", description: "Password must be at least 6 characters.", variant: "destructive" });
    return;
  }
  
  setLoading(true);

  try {
    console.log("[v0] Starting signup for:", email);
    
    // Check if email already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      toast({ title: "Account exists", description: "An account with this email already exists.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if username is taken
    const { data: usernameExists } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (usernameExists) {
      toast({ title: "Username taken", description: "This username is already taken.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Sign up directly (skip email verification for now)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username },
      },
    });

    if (error) {
      console.error("[v0] Signup error:", error);
      toast({ title: "Signup failed", description: error.message || "Unknown error", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create profile
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        full_name: "",
      });

      // Auto-login
      await supabase.auth.signInWithPassword({ email, password });
      toast({ title: "Welcome!", description: "Account created successfully" });
      navigate("/dashboard");
    }
  } catch (err: any) {
    console.error("[v0] Signup error:", err);
    toast({ title: "Signup error", description: err.message || "An unexpected error occurred", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

**Simplify Signup.tsx** - Skip OTP step entirely:

Change the JSX render to just show the form, not the OTP step.

### Option 2: Disable OTP Requirement

In your Supabase project settings:
1. Go to **Authentication** → **Policies**
2. Disable email confirmation requirement (for development only!)
3. Users will be automatically confirmed upon signup

## Which Option Should You Choose?

### ✅ **Option 1: Proper SMTP Setup** (Recommended for Production)
- Secure, professional email verification
- Follows best practices
- Required for production deployment
- Takes ~15 minutes to set up

**See: EDGE_FUNCTION_SETUP.md for detailed instructions**

### ✅ **Option 2: Skip Email Verification** (Quick Testing)
- Fastest to get running
- Good for development/testing
- NOT suitable for production
- Takes ~5 minutes to implement

---

## Setup Time Comparison

| Method | Time | Production Ready | Difficulty |
|--------|------|------------------|------------|
| Skip Verification | 5 min | ❌ No | Easy |
| Supabase Built-in Email | 10 min | ⚠️ Partial | Medium |
| Custom SMTP Email | 15 min | ✅ Yes | Medium |

---

## Recommendation

Since you're asking about Vercel hosting, I recommend:

1. **Short term (testing)**: Use Option 1 (skip email) to test the app locally
2. **Before production**: Set up proper SMTP emails (see EDGE_FUNCTION_SETUP.md)
3. **Production deployment**: Use the full SMTP setup with real email verification

Would you like me to implement Option 1 for quick testing, or help you set up the SMTP configuration?
