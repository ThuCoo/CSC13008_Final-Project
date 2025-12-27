import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Mail, KeyRound } from "lucide-react";

interface ForgotPasswordPageProps {
  step: number;
  email: string;
  setEmail: (val: string) => void;
  otp: string;
  setOtp: (val: string) => void;
  onSendOTP: (e: React.FormEvent) => void;
  onVerifyOTP: (e: React.FormEvent) => void;
  onResetPassword: (e: React.FormEvent) => void;
}

export default function ForgotPasswordPage({
  step,
  email,
  setEmail,
  otp,
  setOtp,
  onSendOTP,
  onVerifyOTP,
  onResetPassword,
}: ForgotPasswordPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Reset Password</h1>

          {step === 1 && (
            <form onSubmit={onSendOTP} className="space-y-4">
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
            <form onSubmit={onVerifyOTP} className="space-y-4">
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
            <form onSubmit={onResetPassword} className="space-y-4">
              <p className="text-slate-500 text-sm mb-4">
                Create a new secure password.
              </p>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input className="pl-9" type="password" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input className="pl-9" type="password" required />
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
