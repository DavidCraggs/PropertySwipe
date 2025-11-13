import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import { Shield, ArrowLeft } from 'lucide-react';

/**
 * Visual indicator showing admin is impersonating a role
 * Appears at top of screen when admin is testing a role
 */
export const AdminModeIndicator: React.FC = () => {
  const { isAdminMode, impersonatedRole, exitRoleSwitch } = useAuthStore();
  const navigate = useNavigate();

  if (!isAdminMode || !impersonatedRole) {
    return null;
  }

  const handleExitRole = () => {
    exitRoleSwitch();
    navigate('/admin-dashboard');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 border-b border-purple-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-white" />
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">
              Admin Mode:
            </span>
            <span className="bg-white/20 px-2 py-1 rounded text-white text-xs font-semibold capitalize">
              {impersonatedRole.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={handleExitRole}
          className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Exit Role</span>
        </button>
      </div>
    </div>
  );
};
