import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

interface LoginPageProps {
  formData: any;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDemoLogin: (email: string, pass: string) => void;
}

export default function LoginPage({
  formData,
  isLoading,
  onChange,
  onSubmit,
  onDemoLogin,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to your AuctionHub account
          </p>

          <form className="space-y-4 mb-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="space-y-3 text-sm flex justify-between items-center">
            <Link
              to="/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot your password?
            </Link>
            <Link
              to="/signup"
              className="text-primary hover:underline font-medium"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-8">
          <p className="text-sm text-blue-900 mb-3">
            <strong>Demo Accounts:</strong>
          </p>
          <div className="space-y-2">
            <button
              onClick={() =>
                onDemoLogin("buyer@example.com", "password123")
              }
              className="w-full text-left text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded transition"
            >
            Buyer
            </button>
            <button
              onClick={() =>
                onDemoLogin("seller@example.com", "password123")
              }
              className="w-full text-left text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded transition"
            >
            Seller
            </button>
            <button
              onClick={() =>
                onDemoLogin("admin@example.com", "password123")
              }
              className="w-full text-left text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded transition"
            >
            Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}