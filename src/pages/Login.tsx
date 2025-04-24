/* src/pages/Login.tsx */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // Correct import path
import { toast } from "@/components/ui/sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Logged in successfully");
      // Redirect to / handled by App.tsx
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.webp')" }}
    >
      <div className="w-full max-w-md bg-background/10 backdrop-blur-md border border-sidebar-border/20 rounded-lg shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground text-white">Welcome to Gajiku</h1>
          <p className="text-sm text-muted-foreground text-white">
            Sign in to your account
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10 bg-background/50 border-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 bg-background/50 border-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
        <div className="text-center mt-4 text-sm text-muted-foreground text-white">
          © 2025 Gajiku. All rights reserved.
        </div>
      </div>
    </div>
  );
}