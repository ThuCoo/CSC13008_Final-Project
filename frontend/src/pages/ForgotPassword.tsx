import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { Mail, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../lib/api-client";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Pass
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
        await apiClient.post("/auth/forgot", { email });
        toast({
          title: "OTP Sent",
          description: `An OTP code has been sent to ${email}`,
        });
        setStep(2);
    } catch (error: any) {
        toast({ title: "Error", description: error.response?.data?.message || "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await apiClient.post("/auth/verify", { email, code: otp });
        setStep(3);
    } catch (error: any) {
        toast({
          title: "Invalid OTP",
          description: error.response?.data?.message || "Please check your code",
          variant: "destructive",
        });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        toast({ title: "Passwords match error", description: "Passwords do not match.", variant: "destructive" });
        return;
    }
    if (newPassword.length < 8) {
        toast({ title: "Password too short", description: "Must be at least 8 characters.", variant: "destructive" });
        return;
    }

    try {
        await apiClient.post("/auth/reset", { email, code: otp, newPassword });
        toast({
          title: "Success",
          description: "Password updated successfully. Please login.",
        });
        navigate("/login");
    } catch (error: any) {
        toast({ title: "Reset Failed", description: error.response?.data?.message || "Could not reset password", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Reset Password</h1>

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <p className="text-slate-500 text-sm mb-4">
                Enter your email to receive a verification code.
              </p>
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Send OTP
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-slate-500 text-sm mb-4">
                Enter the 6-digit code sent to your email.
              </p>
              <div>
                <label className="text-sm font-medium">OTP Code</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Verify
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-slate-500 text-sm mb-4">
                Create a new secure password.
              </p>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-9" 
                    type="password" 
                    required 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-9" 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
