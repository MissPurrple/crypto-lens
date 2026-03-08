import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Moon, Sun, LogIn, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AppHeader() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const links = [
    { to: "/", label: "Analyze" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50" role="banner">
      <div className="container flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2" aria-label="Litepaper X-Ray home">
          <span className="text-lg font-mono font-bold text-gradient-primary">LITEPAPER X-RAY</span>
          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">v1</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              aria-current={location.pathname === link.to ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="ml-1 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 text-muted-foreground hover:text-foreground font-mono text-xs gap-1.5"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline max-w-[100px] truncate">{user.email}</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 text-muted-foreground hover:text-foreground font-mono text-xs gap-1.5"
                aria-label="Sign in"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
