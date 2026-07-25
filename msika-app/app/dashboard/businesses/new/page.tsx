"use client";

import { useState } from "react";
import { ArrowLeft, Save, Store, User, Phone, MapPin, CreditCard, Hash, Crosshair } from "lucide-react";
import Link from "next/link";

const businessTypes = [
  "Market Vendor", "Restaurant", "Pharmacy", "Hardware Store", "Salon",
  "Butchery", "Wholesaler", "Retail Shop", "Tailor", "Grocery", "Electronics Shop"
];

export default function NewBusinessPage() {
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    nationalId: "",
    email: "",
    businessType: "",
    market: "",
    section: "",
    block: "",
    stallNumber: "",
    gpsLat: "",
    gpsLong: "",
    wallet: "Airtel Money",
    walletNumber: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Business registered! Vendor Number: VN-${Math.floor(Math.random() * 90000 + 10000)}`);
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30 transition-all";

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/businesses" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Register Business</h1>
          <p className="text-sm text-gray-500 mt-1">Complete business and vendor registration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-8">
        {/* Section 1: Business Info */}
        <div>
          <h3 className="text-sm font-bold text-[#3d5a45] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Store size={16} />
            Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. Grace's Grocery" className={inputClass} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className={inputClass} required>
                <option value="">Select Type</option>
                {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder="e.g. Grace Banda" className={inputClass} required />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & ID */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-[#3d5a45] uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={16} />
            Contact & Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0991234567" className={inputClass} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">National ID</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder="MG123456" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="owner@email.com" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-[#3d5a45] uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin size={16} />
            Market Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
              <select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} className={inputClass} required>
                <option value="">Select Market</option>
                <option value="Limbe Market">Limbe Market</option>
                <option value="Mpemba Market">Mpemba Market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={inputClass} required>
                <option value="">Select Section</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fish">Fish</option>
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Block</label>
                <input type="text" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="A" className={inputClass} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Stall #</label>
                <input type="text" value={form.stallNumber} onChange={(e) => setForm({ ...form, stallNumber: e.target.value })} placeholder="12" className={inputClass} />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GPS Latitude</label>
              <div className="relative">
                <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={form.gpsLat} onChange={(e) => setForm({ ...form, gpsLat: e.target.value })} placeholder="-15.7861" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GPS Longitude</label>
              <div className="relative">
                <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={form.gpsLong} onChange={(e) => setForm({ ...form, gpsLong: e.target.value })} placeholder="35.0058" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Payment */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-[#3d5a45] uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard size={16} />
            Mobile Wallet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Wallet</label>
              <select value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} className={inputClass}>
                <option>Airtel Money</option>
                <option>TNM Mpamba</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="tel" value={form.walletNumber} onChange={(e) => setForm({ ...form, walletNumber: e.target.value })} placeholder="0991234567" className={inputClass} required />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
          <Link href="/dashboard/businesses" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
            Cancel
          </Link>
          <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20">
            <Save size={16} />
            Register Business
          </button>
        </div>
      </form>
    </div>
  );
}