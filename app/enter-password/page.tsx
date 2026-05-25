"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function EnterPasswordPage() {
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    document.cookie = `site-access=${password}; path=/; max-age=${60 * 60 * 24 * 30}`;

    window.location.href = "/";
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-400/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="backdrop-blur-xl bg-card/80 border-border shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="flex justify-center mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20"
              >
                <GraduationCap className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
              UniShare Portal
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Enter the access key to unlock the platform
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-emerald-500 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    type="password"
                    placeholder="Access Key"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setIsError(false);
                    }}
                    className="pl-12 h-14 text-lg border-border focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-2xl"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 group transition-all overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Verify & Unlock
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </Button>
            </form>

            <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Protected by Enterprise Security</span>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-sm mt-8">
          &copy; 2025 UniShare &bull; All Academic Resources Protected
        </p>
      </motion.div>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
