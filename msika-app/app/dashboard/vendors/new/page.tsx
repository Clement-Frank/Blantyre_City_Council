"use client";

import { useState } from "react";
import { ArrowLeft, Save, User, Phone, MapPin, Store, Hash } from "lucide-react";
import Link from "next/link";

export default function NewVendorPage() {
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    market: "",
    section: "",
    feeType: "standard",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Vendor registered successfully! Vendor ID: V-00512 (Mock)");
  };

  return (
    <div className="space-y-6 max-w-[800px]">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/vendors" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Register Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Onboard a new market vendor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Grace Banda"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="e.g. 0991234567"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type</label>
            <select
              value={form.feeType}
              onChange={(e) => setForm({ ...form, feeType: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 appearance-none"
            >
              <option value="standard">Standard Daily Fee (MWK 300)</option>
              <option value="bulk">Kupikulisa Bulk Fee (MWK 2,000)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={form.market}
                onChange={(e) => setForm({ ...form, market: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 appearance-none"
                required
              >
                <option value="">Select Market</option>
                <option value="Limbe Market">Limbe Market</option>
                <option value="Mpemba Market">Mpemba Market</option>
                <option value="Chadzunda Market">Chadzunda Market</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 appearance-none"
                required
              >
                <option value="">Select Section</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fish">Fish</option>
                <option value="Textiles">Textiles</option>
                <option value="Hardware">Hardware</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#e8f0ec] rounded-xl border border-[#d4e5dc]">
          <p className="text-sm font-medium text-[#3d5a45] mb-1">Vendor ID Preview</p>
          <p className="text-xs text-[#3d5a45]/70">A unique Vendor ID (e.g. V-00512) and optional QR code will be generated automatically upon registration.</p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/dashboard/vendors" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
            Cancel
          </Link>
          <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
            <Save size={16} />
            Register Vendor
          </button>
        </div>
      </form>
    </div>
  );
}