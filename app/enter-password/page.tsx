"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, GraduationCap } from "lucide-react";

export default function EnterPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 设置 Cookie（过期时间 30 天）
    document.cookie = `site-access=${password}; path=/; max-age=${60 * 60 * 24 * 30}`;
    
    // 强制刷新，Middleware 会重新检查 Cookie
    window.location.href = "/";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Private Access</CardTitle>
          <CardDescription>
            This site is protected. Please enter the site password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="password"
                placeholder="Enter Site Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className="pl-10 h-12 text-lg border-slate-200 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg shadow-md transition-all">
              Verify & Enter
            </Button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-6">
            Contact the administrator if you don&apos;t have the password.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

