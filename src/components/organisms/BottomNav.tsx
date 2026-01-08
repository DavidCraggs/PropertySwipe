import { Home, Heart, User, LayoutDashboard, HousePlus, HouseHeart, MessageSquare, Building2 } from 'lucide-react';
import { useAppStore } from '../../hooks';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { RenterProfile } from '../../types';

interface BottomNavProps {
  currentPage: 'swipe' | 'matches' | 'profile' | 'tenancy';
  onNavigate: (page: 'swipe' | 'matches' | 'profile' | 'tenancy') => void;
}

/**
 * BottomNav component
 * Fixed bottom navigation with active state indicators
 * Badge for unread matches
 * Shows different labels for landlords vs renters vs agencies
 * Shows "My Tenancy" tab for current renters
 */
export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { matches } = useAppStore();
  const { userType, currentUser } = useAuthStore();
  const unreadCount = matches.reduce((sum, match) => sum + (match.unreadCount || 0), 0);

  const isLandlord = userType === 'landlord';
  const isAgency = userType === 'estate_agent' || userType === 'management_agency';
  const isCurrentRenter = userType === 'renter' && (currentUser as RenterProfile)?.status === 'current';

  // Agency-specific navigation
  const agencyNavItems = [
    {
      id: 'swipe' as const,
      label: 'Dashboard',
      icon: Building2,
      badge: null,
    },
    {
      id: 'matches' as const,
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  // Current renter navigation (with tenancy tab)
  const currentRenterNavItems = [
    {
      id: 'tenancy' as const,
      label: 'My Tenancy',
      icon: HouseHeart,
      badge: null,
    },
    {
      id: 'swipe' as const,
      label: 'Swipe',
      icon: HousePlus,
      badge: null,
    },
    {
      id: 'matches' as const,
      label: 'Matches',
      icon: Heart,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  // Default navigation (renters looking, landlords)
  const defaultNavItems = [
    {
      id: 'swipe' as const,
      label: isLandlord ? 'Dashboard' : 'Swipe',
      icon: isLandlord ? LayoutDashboard : Home,
      badge: null,
    },
    {
      id: 'matches' as const,
      label: isLandlord ? 'Renters' : 'Matches',
      icon: Heart,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  // Select appropriate nav items based on user type
  const navItems = isAgency
    ? agencyNavItems
    : isCurrentRenter
      ? currentRenterNavItems
      : defaultNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 safe-area-inset-bottom z-30">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all min-w-[80px] ${isActive
                ? 'bg-primary-50 text-primary-600'
                : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'fill-primary-200' : ''}
                />
                {item.badge !== null && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${isActive ? 'text-primary-600' : 'text-neutral-600'
                  }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
