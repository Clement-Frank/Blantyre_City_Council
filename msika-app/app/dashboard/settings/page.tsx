"use client";

import { useState } from "react";
import { Save, Bell, Shield, User, Building2 } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "organization", label: "Organization", icon: Building2 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and system preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#3d5a45] text-[#3d5a45]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-5 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input type="text" defaultValue="Sarah" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input type="text" defaultValue="Miller" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" defaultValue="sarah.miller@bcc.mw" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <input type="text" defaultValue="System Administrator" disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-500" />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input type="password" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input type="password" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input type="password" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30" />
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4 max-w-lg">
              {["Payment confirmations", "Daily revenue summary", "Failed payment alerts", "New vendor registrations"].map((item) => (
                <div key={item} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item}</p>
                    <p className="text-xs text-gray-500">Receive via email and SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3d5a45]"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === "organization" && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Council Name</label>
                <input type="text" defaultValue="Blantyre City Council" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Market</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a9e8f]/30">
                  <option>Limbe Market</option>
                  <option>Mpemba Market</option>
                  <option>Chadzunda Market</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] text-white text-sm font-medium rounded-xl transition-colors">
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}