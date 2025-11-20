import React, { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  Shield,
  User,
  Home,
  Building2,
  Briefcase,
  ChevronRight,
  LogOut,
  Activity,
  Database
} from 'lucide-react';
import type { UserType } from '../types';
import { SeedDataModal } from '../components/organisms/SeedDataModal';

interface RoleCard {
  type: Exclude<UserType, 'admin'>;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  testEmail: string;
}

const roleCards: RoleCard[] = [
  {
    type: 'renter',
    title: 'Renter',
    description: 'Browse properties, swipe, and create matches',
    icon: User,
    gradient: 'from-blue-500 to-cyan-500',
    testEmail: 'test.renter@geton.com',
  },
  {
    type: 'landlord',
    title: 'Landlord',
    description: 'Manage properties, view applications, and matches',
    icon: Home,
    gradient: 'from-green-500 to-emerald-500',
    testEmail: 'test.landlord@geton.com',
  },
  {
    type: 'estate_agent',
    title: 'Estate Agent',
    description: 'Market properties and manage client relationships',
    icon: Building2,
    gradient: 'from-orange-500 to-red-500',
    testEmail: 'test.estateagent@geton.com',
  },
  {
    type: 'management_agency',
    title: 'Management Agency',
    description: 'Handle maintenance, issues, and tenant management',
    icon: Briefcase,
    gradient: 'from-purple-500 to-pink-500',
    testEmail: 'test.managementagency@geton.com',
  },
];

/**
 * Admin Dashboard - Role selector for admin impersonation
 */
export const AdminDashboard: React.FC = () => {
  const { switchToRole, logout, adminProfile, impersonatedRole } = useAuthStore();
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  const handleRoleSelect = async (roleType: Exclude<UserType, 'admin'>) => {
    await switchToRole(roleType);
    // Note: App.tsx will automatically route to 'app' when switchToRole() completes
  };

  const handleLogout = () => {
    logout();
    // Note: App.tsx will automatically route to welcome/role-select when logout() is called
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-sm text-purple-300">
                  {adminProfile?.name || 'Administrator'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSeedModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 border border-primary-500 rounded-lg text-white transition"
              >
                <Database className="w-4 h-4" />
                <span>Seed Test Data</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Select User Role
          </h2>
          <p className="text-lg text-purple-300">
            Choose a role to test the platform as that user type
          </p>
        </div>

        {/* Current Role Indicator */}
        {impersonatedRole && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-green-300 font-medium">
                  Currently viewing as: <span className="capitalize">{impersonatedRole.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {roleCards.map((role) => (
            <button
              key={role.type}
              onClick={() => handleRoleSelect(role.type)}
              className="group relative bg-white/10 backdrop-blur-md hover:bg-white/15 border border-white/20 hover:border-white/30 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-105 hover:shadow-2xl"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-200`} />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${role.gradient} mb-4`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-between">
                  {role.title}
                  <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </h3>

                {/* Description */}
                <p className="text-purple-200 mb-4">
                  {role.description}
                </p>

                {/* Test Account Info */}
                <div className="flex items-center gap-2 text-sm text-purple-300/80">
                  <span className="bg-white/5 px-2 py-1 rounded">
                    {role.testEmail}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-white/60 text-sm">
            Click any role card to experience the platform from that user's perspective
          </p>
        </div>
      </main>

      {/* Seed Data Modal */}
      <SeedDataModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
      />
    </div>
  );
};
