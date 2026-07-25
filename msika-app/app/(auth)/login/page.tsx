"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedUsername = username.trim().toLowerCase();
      const normalizedPassword = password.trim();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          password: normalizedPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.role === 'Collector' || data.role === 'Supervisor' || data.role === 'Administrator') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }

    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      
      {/* ========== MOBILE VIEW (modern centered card) ========== */}
      <div className="sm:hidden min-h-screen w-full bg-gradient-to-br from-[#e8f0ec] via-[#d4e5dc] to-[#c8ddd0] flex flex-col items-center justify-center p-5 relative">
        
        {/* Subtle background decorative elements */}
        <div className="absolute top-[-80px] left-[-80px] w-[250px] h-[250px] rounded-full bg-[#3d5a45]/5" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full bg-[#3d5a45]/5" />
        <div className="absolute top-[20%] right-[10%] w-4 h-4 rounded-full bg-[#3d5a45]/10" />
        <div className="absolute bottom-[30%] left-[8%] w-3 h-3 rounded-full bg-[#3d5a45]/10" />

        {/* Logo + Coat of Arms Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#3d5a45] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#3d5a45] tracking-wider leading-tight">BLANTYRE</p>
              <p className="text-[9px] font-bold text-[#3d5a45] tracking-wider leading-tight">CITY COUNCIL</p>
            </div>
          </div>

          <img 
            src="/malawi-coat-of-arms.png" 
            alt="Malawi Coat of Arms" 
            className="w-24 h-auto object-contain rounded-xl shadow-md"
          />
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[380px] bg-gradient-to-b from-[#3d5a45] to-[#2d4335] rounded-[20px] shadow-xl shadow-[#2d4335]/30 p-7">
          
          <h1 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
            Login
          </h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-white/85 mb-2.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/35 text-[14px] focus:outline-none focus:border-[#5a9e8f] focus:ring-2 focus:ring-[#5a9e8f]/30 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-white/85 mb-2.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/35 text-[14px] focus:outline-none focus:border-[#5a9e8f] focus:ring-2 focus:ring-[#5a9e8f]/30 transition-all duration-200 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right pt-0.5">
              <a href="#" className="text-[12px] text-[#7bc4b5] hover:text-[#9dd9cc] transition-colors duration-200">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#5a9e8f] hover:bg-[#4a8e7f] active:bg-[#3d7a6d] text-white font-semibold rounded-xl transition-all duration-200 text-[14px] shadow-lg shadow-[#5a9e8f]/25 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-[#3d5a45]/60">
            2024 Blantyre City Council. All rights reserved.
          </p>
        </div>
      </div>

      {/* ========== DESKTOP VIEW (original split-screen) ========== */}
      <div className="hidden sm:flex min-h-screen w-full bg-[#2d4a3e] items-center justify-center p-4 relative overflow-hidden">
        
        {/* Background decorative circles */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full bg-white/5" />
        <div className="absolute top-[10%] right-[5%] w-[80px] h-[80px] rounded-full bg-white/5" />
        <div className="absolute bottom-[20%] left-[10%] w-[40px] h-[40px] rounded-full bg-white/5" />
        <div className="absolute bottom-[10%] right-[20%] w-[60px] h-[60px] rounded-full bg-white/5" />

        <div className="w-full max-w-[1000px] min-h-[600px] bg-white rounded-[40px] flex overflow-hidden shadow-2xl relative z-10">
          
          {/* LEFT SIDE - Logo + Coat of Arms */}
          <div className="w-[45%] bg-white relative flex flex-col justify-between p-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#3d5a45] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#3d5a45] tracking-wider leading-tight">BLANTYRE</p>
                <p className="text-[10px] font-semibold text-[#3d5a45] tracking-wider leading-tight">CITY</p>
                <p className="text-[10px] font-semibold text-[#3d5a45] tracking-wider leading-tight">COUNCIL</p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <img 
                src="/malawi-coat-of-arms.png" 
                alt="Malawi Coat of Arms" 
                className="w-48 h-auto object-contain rounded-2xl shadow-lg"
              />
            </div>

            <div className="text-[9px] text-gray-400">
              <p>2024 Blantyre City Council</p>
              <p>Powered by The Malawi Government</p>
            </div>
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="w-[55%] bg-[#2d4a3e] flex flex-col justify-center px-16 py-12 relative">
            <div className="absolute top-[15%] right-[10%] w-3 h-3 rounded-full bg-white/10" />
            <div className="absolute top-[40%] right-[5%] w-2 h-2 rounded-full bg-white/10" />
            <div className="absolute bottom-[25%] right-[15%] w-4 h-4 rounded-full bg-white/10" />

            <div className="max-w-[320px] mx-auto w-full">
              <h1 className="text-3xl font-semibold text-white mb-8">Login</h1>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2.5 mb-4">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-white/90 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 bg-[#1e3329] border border-[#3d5a45] rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#5a9e8f] focus:ring-1 focus:ring-[#5a9e8f] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/90 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-[#1e3329] border border-[#3d5a45] rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#5a9e8f] focus:ring-1 focus:ring-[#5a9e8f] transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <a href="#" className="text-xs text-[#5a9e8f] hover:text-[#6bb8a8] transition-colors underline underline-offset-2">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#5a9e8f] hover:bg-[#4a8e7f] text-white font-medium rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}