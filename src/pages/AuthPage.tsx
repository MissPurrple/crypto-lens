import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = tab === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

      if (error) {
        toast.error(error.message);
      } else if (tab === "signup") {
        toast.success("Account created! Check your email to confirm.");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-mono font-bold text-gradient-primary">LITEPAPER X-RAY</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ruthless crypto document analysis
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="signin" className="font-mono text-xs">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="font-mono text-xs">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-mono text-muted-foreground mb-1 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-secondary border-border font-mono text-sm"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-mono text-muted-foreground mb-1 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-secondary border-border font-mono text-sm"
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <TabsContent value="signin" className="mt-0 p-0">
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-mono text-sm uppercase tracking-widest glow-primary"
              >
                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                Sign In
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="mt-0 p-0">
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-mono text-sm uppercase tracking-widest glow-primary"
              >
                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                Create Account
              </Button>
            </TabsContent>
          </form>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Continue without account?{" "}
          <a href="/" className="text-primary hover:underline">
            Use as guest
          </a>
        </p>
      </div>
    </div>
  );
}
