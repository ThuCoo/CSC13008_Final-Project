
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Chrome } from "lucide-react";
import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useToast } from "../hooks/use-toast";

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">


      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-white rounded-xl border border-border p-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground mb-8">Join eBid to start bidding and selling</p>

          <div className="mb-6">
            <Button variant="outline" className="w-full mb-3 flex items-center justify-center gap-2">
              <Chrome className="w-4 h-4" />
              Sign up with Google
            </Button>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Sign up with Apple
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">Or create with email</span>
            </div>
          </div>

          <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
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
                  placeholder="Create a password"
                  className="pl-10"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <div className="space-y-3 text-sm">
            <p className="text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
