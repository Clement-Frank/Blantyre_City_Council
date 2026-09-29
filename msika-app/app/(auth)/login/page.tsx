"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import CouncilLogo from "@/components/CouncilLogo";

export default function LoginPage() {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      window.location.href = '/dashboard';
      
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0E0E0B]">
      {/* Subtle lime accents */}
      <div className="absolute top-[-150px] right-[-100px] w-[400px] h-[400px] rounded-full bg-[#AFE607]/5 blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full bg-[#AFE607]/5 blur-3xl" />

      {/* Mobile View */}
      <div className="sm:hidden min-h-screen w-full flex flex-col items-center justify-center p-5 relative">
        <div className="flex flex-col items-center mb-8">
          <CouncilLogo className="w-24 h-auto drop-shadow-[0_8px_24px_rgba(175,230,7,0.15)]" />
          <p className="mt-3 text-[11px] font-bold text-white tracking-[0.2em] leading-tight text-center">BLANTYRE</p>
          <p className="text-[11px] font-bold text-white tracking-[0.2em] leading-tight text-center">CITY COUNCIL</p>
        </div>

        <div className="w-full max-w-[380px] bg-[#1A1A16] border border-[#2A2A24] rounded-[24px] shadow-2xl shadow-black/40 p-7">
          <h1 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">Login</h1>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-2.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-3.5 bg-[#0E0E0B] border border-[#2A2A24] rounded-xl text-white placeholder-white/25 text-[14px] focus:outline-none focus:border-[#AFE607] focus:ring-2 focus:ring-[#AFE607]/20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/70 mb-2.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3.5 bg-[#0E0E0B] border border-[#2A2A24] rounded-xl text-white placeholder-white/25 text-[14px] focus:outline-none focus:border-[#AFE607] focus:ring-2 focus:ring-[#AFE607]/20 transition-all duration-200 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#AFE607] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="text-right pt-0.5">
              <a href="#" className="text-[12px] text-[#AFE607] hover:text-[#C5F92E] transition-colors duration-200">
                Forgot Password?
              </a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#AFE607] hover:bg-[#9AD106] active:bg-[#8BC105] text-[#0E0E0B] font-bold rounded-xl transition-all duration-200 text-[14px] shadow-lg shadow-[#AFE607]/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-white/30">2024 Blantyre City Council. All rights reserved.</p>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:flex min-h-screen w-full items-center justify-center p-4 relative">
        <div className="absolute top-[-150px] right-[10%] w-[300px] h-[300px] rounded-full bg-[#AFE607]/5 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[5%] w-[200px] h-[200px] rounded-full bg-[#AFE607]/5 blur-3xl" />

        <div className="w-full max-w-[1000px] min-h-[600px] bg-white rounded-[32px] flex overflow-hidden shadow-2xl relative z-10">
          {/* LEFT SIDE - Branding */}
          <div className="w-[45%] bg-[#0E0E0B] relative flex flex-col justify-between p-8 rounded-l-[32px]">
            <div className="flex flex-col items-center text-center">
              <CouncilLogo className="w-16 h-auto" />
              <div className="mt-2">
                <p className="text-[10px] font-bold text-white tracking-[0.2em] leading-tight">BLANTYRE</p>
                <p className="text-[10px] font-bold text-white tracking-[0.2em] leading-tight">CITY COUNCIL</p>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <CouncilLogo className="w-52 h-auto drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)]" />
            </div>
            
            <div className="text-[9px] text-white/30">
              <p>2024 Blantyre City Council</p>
              <p>Powered by The Malawi Government</p>
            </div>
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="w-[55%] bg-white flex flex-col justify-center px-16 py-12 relative">
            <div className="max-w-[320px] mx-auto w-full">
              <h1 className="text-3xl font-bold text-[#0E0E0B] mb-2">Welcome back</h1>
              <p className="text-sm text-gray-500 mb-8">Sign in to your council dashboard</p>
              
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#0E0E0B] mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full px-4 py-3 bg-[#F5F5F0] border border-[#E5E5E0] rounded-xl text-[#0E0E0B] placeholder-gray-400 text-sm focus:outline-none focus:border-[#AFE607] focus:ring-2 focus:ring-[#AFE607]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E0E0B] mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 bg-[#F5F5F0] border border-[#E5E5E0] rounded-xl text-[#0E0E0B] placeholder-gray-400 text-sm focus:outline-none focus:border-[#AFE607] focus:ring-2 focus:ring-[#AFE607]/20 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0E0E0B] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <a href="#" className="text-xs text-[#0E0E0B] hover:text-[#AFE607] transition-colors underline underline-offset-2 font-medium">
                    Forgot Password?
                  </a>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#AFE607] hover:bg-[#9AD106] text-[#0E0E0B] font-bold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-[#AFE607]/25 disabled:opacity-50"
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