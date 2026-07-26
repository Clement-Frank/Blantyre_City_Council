"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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

      if (data.role === 'Collector') window.location.href = '/dashboard/collector';
      else if (data.role === 'Supervisor') window.location.href = '/dashboard/supervisor';
      else window.location.href = '/dashboard';
      
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
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#AFE607] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#0E0E0B]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white tracking-wider leading-tight">BLANTYRE</p>
              <p className="text-[10px] font-bold text-white tracking-wider leading-tight">CITY COUNCIL</p>
            </div>
          </div>
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#AFE607] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#0E0E0B]" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white tracking-wider leading-tight">BLANTYRE</p>
                <p className="text-[10px] font-bold text-white tracking-wider leading-tight">CITY</p>
                <p className="text-[10px] font-bold text-white tracking-wider leading-tight">COUNCIL</p>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="w-48 h-48 bg-[#1A1A16] rounded-2xl flex items-center justify-center border border-[#2A2A24]">
                <svg viewBox="0 0 24 24" className="w-24 h-24 text-[#AFE607]" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
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