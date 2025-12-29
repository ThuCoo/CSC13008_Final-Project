
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useToast } from "../hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(formData.email, formData.password);
      if (!success) throw new Error("Invalid credentials");
      toast({ title: "Success", description: "Logged in successfully!" });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (!success) throw new Error("Demo login failed");
      toast({ title: "Success", description: `Logged in as ${email}` });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to your eBid account
          </p>

          <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you..example.com"
                  className="pl-10"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  onChange={handleChange}
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

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-8">
          <p className="text-sm text-rose-900 mb-3">
            <strong>Demo Accounts:</strong>
          </p>
          <div className="space-y-2">
            <button
              onClick={() =>
                handleDemoLogin("buyer@example.com", "password123")
              }
              className="w-full text-left text-xs px-2 py-1 bg-rose-100 hover:bg-rose-200 rounded transition"
            >
              Buyer
            </button>
            <button
              onClick={() =>
                handleDemoLogin("seller@example.com", "password123")
              }
              className="w-full text-left text-xs px-2 py-1 bg-rose-100 hover:bg-rose-200 rounded transition"
            >
              Seller
            </button>
            <button
              onClick={() =>
                handleDemoLogin("admin@example.com", "password123")
              }
              className="w-full text-left text-xs px-2 py-1 bg-rose-100 hover:bg-rose-200 rounded transition"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
