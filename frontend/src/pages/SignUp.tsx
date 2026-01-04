import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Chrome, Facebook, MapPin } from "lucide-react";
import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useToast } from "../hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";

export default function SignUp() {
  const navigate = useNavigate();
  const { sendOtp, resendOtp, verifyOtp, login } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
  });
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      const newErrors = { ...errors };
      delete newErrors[e.target.name];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Check if reCAPTCHA is completed
      if (!recaptchaToken) {
        toast({
          title: "Error",
          description: "Please complete the reCAPTCHA verification",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        await sendOtp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          address: formData.address,
          recaptchaToken,
        });
        setShowOtp(true);
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to send OTP",
          variant: "destructive",
        });
        // Reset reCAPTCHA on error
        setRecaptchaToken(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(formData.email, otp);

      const loginSuccess = await login(formData.email, formData.password);
      if (loginSuccess) {
        toast({
          title: "Success",
          description: "Account verified and logged in successfully!",
        });
        navigate("/");
      } else {
        toast({
          title: "Verified",
          description: "Account verified. Please log in.",
        });
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to verify OTP",
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
          <h1 className="text-3xl font-bold mb-2">
            {showOtp ? "Verify Email" : "Create Account"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {showOtp
              ? "Enter the 6-digit code sent to your email."
              : "Join eBid to start bidding and selling"}
          </p>

          {!showOtp ? (
            <>
              <div className="mb-6">
                <Button
                  variant="outline"
                  className="w-full mb-3 flex items-center justify-center gap-2"
                >
                  <Chrome className="w-4 h-4" />
                  Sign up with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  Sign up with Facebook
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-muted-foreground">
                    Or create with email
                  </span>
                </div>
              </div>

              <form className="space-y-4 mb-6" onSubmit={handleInitialSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      className={`pl-10 ${
                        errors.name
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className={`pl-10 ${
                        errors.email
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="123 Main St, City"
                      className={`pl-10 ${
                        errors.address
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Create a password"
                      className={`pl-10 ${
                        errors.password
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      className={`pl-10 ${
                        errors.confirmPassword
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* reCAPTCHA v2 Checkbox */}
                <div className="flex justify-center my-4">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={(token) => setRecaptchaToken(token)}
                    onExpired={() => setRecaptchaToken(null)}
                    onErrored={() => setRecaptchaToken(null)}
                  />
                </div>

                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Continue"}
                </Button>
              </form>
            </>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="flex justify-center">
                <div className="flex gap-2 items-center justify-center">
                  <Input
                    className="text-center text-2xl tracking-widest w-40"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                  />
                </div>
              </div>

              <div className="text-center text-sm">
                <p className="text-muted-foreground">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline disabled:opacity-50"
                    disabled={isLoading}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        await resendOtp(formData.email);
                        toast({
                          title: "Code Resent",
                          description:
                            "Please check your email for the new code.",
                        });
                      } catch (error: unknown) {
                        toast({
                          title: "Error",
                          description:
                            error instanceof Error
                              ? error.message
                              : "Failed to resend code",
                          variant: "destructive",
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Resend
                  </button>
                </p>
              </div>

              <Button className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify & Create Account"}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                type="button"
                onClick={() => setShowOtp(false)}
              >
                Back
              </Button>
            </form>
          )}

          <div className="space-y-3 text-sm mt-6">
            <p className="text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
