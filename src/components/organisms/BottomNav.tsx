import { useAppStore } from '../../hooks';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { RenterProfile } from '../../types';

interface BottomNavProps {
  currentPage: 'swipe' | 'matches' | 'profile' | 'tenancy' | 'properties';
  onNavigate: (page: 'swipe' | 'matches' | 'profile' | 'tenancy' | 'properties') => void;
}

/**
 * BottomNav — Concept C text-only navigation
 * Semi-transparent backdrop blur, teal underline active indicator
 * Libre Franklin 9px weight 900, letter-spacing 2.5px, uppercase
 */
export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { matches } = useAppStore();
  const { userType, currentUser } = useAuthStore();
  const unreadCount = matches.reduce((sum, match) => sum + (match.unreadCount || 0), 0);

  const isLandlord = userType === 'landlord';
  const isAgency = userType === 'estate_agent' || userType === 'management_agency';
  const isCurrentRenter = userType === 'renter' && (currentUser as RenterProfile)?.status === 'current';

  const agencyNavItems = [
    { id: 'swipe' as const, label: 'DASHBOARD' },
    { id: 'properties' as const, label: 'PORTFOLIO' },
    { id: 'matches' as const, label: 'MESSAGES', badge: unreadCount > 0 ? unreadCount : null },
    { id: 'profile' as const, label: 'YOU' },
  ];

  const currentRenterNavItems = [
    { id: 'tenancy' as const, label: 'TENANCY' },
    { id: 'swipe' as const, label: 'DISCOVER' },
    { id: 'matches' as const, label: 'MATCHES', badge: unreadCount > 0 ? unreadCount : null },
    { id: 'profile' as const, label: 'YOU' },
  ];

  const landlordNavItems = [
    { id: 'swipe' as const, label: 'DASHBOARD' },
    { id: 'properties' as const, label: 'PROPERTIES' },
    { id: 'matches' as const, label: 'RENTERS', badge: unreadCount > 0 ? unreadCount : null },
    { id: 'profile' as const, label: 'YOU' },
  ];

  const defaultNavItems = [
    { id: 'swipe' as const, label: 'DISCOVER' },
    { id: 'matches' as const, label: 'MATCHES', badge: unreadCount > 0 ? unreadCount : null },
    { id: 'profile' as const, label: 'YOU' },
  ];

  type NavItem = { id: 'swipe' | 'matches' | 'profile' | 'tenancy' | 'properties'; label: string; badge?: number | null };

  const navItems: NavItem[] = isAgency
    ? agencyNavItems
    : isLandlord
      ? landlordNavItems
      : isCurrentRenter
        ? currentRenterNavItems
        : defaultNavItems;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--color-nav)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--color-line)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0 calc(12px + env(safe-area-inset-bottom, 16px))',
        zIndex: 30,
      }}
    >
      {navItems.map((tab) => {
        const isActive = currentPage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: 2.5,
              color: isActive ? 'var(--color-teal)' : 'var(--color-sub)',
              cursor: 'pointer',
              position: 'relative',
              padding: '4px 0',
              background: 'none',
              border: 'none',
            }}
          >
            {tab.label}
            {/* Badge for unread count */}
            {tab.badge != null && tab.badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -10,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
            {/* Active underline indicator */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -3,
                  left: '15%',
                  right: '15%',
                  height: 2.5,
                  background: 'var(--color-teal)',
                  borderRadius: 2,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
