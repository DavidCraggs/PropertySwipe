import { Home, Heart, User } from 'lucide-react';
import { useAppStore } from '../../hooks';

interface BottomNavProps {
  currentPage: 'swipe' | 'matches' | 'profile';
  onNavigate: (page: 'swipe' | 'matches' | 'profile') => void;
}

/**
 * BottomNav component
 * Fixed bottom navigation with active state indicators
 * Badge for unread matches
 */
export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { matches } = useAppStore();
  const unreadCount = matches.reduce((sum, match) => sum + (match.unreadCount || 0), 0);

  const navItems = [
    {
      id: 'swipe' as const,
      label: 'Swipe',
      icon: Home,
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
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all min-w-[80px] ${
                isActive
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
                  fill={isActive ? 'currentColor' : 'none'}
                />
                {item.badge !== null && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isActive ? 'text-primary-600' : 'text-neutral-600'
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
