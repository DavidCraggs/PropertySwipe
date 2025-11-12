import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { RoleSelectionScreen } from './pages/RoleSelectionScreen';
import { LoginPage } from './pages/LoginPage';
import { RenterOnboarding } from './pages/RenterOnboarding';
import { LandlordOnboarding } from './pages/LandlordOnboarding';
import { AgencyOnboarding } from './pages/AgencyOnboarding';
import { SwipePage } from './pages/SwipePage';
import { LandlordDashboard } from './pages/LandlordDashboard';
import { AgencyDashboard } from './pages/AgencyDashboard';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { BottomNav } from './components/organisms/BottomNav';
import { ToastContainer, useToastStore } from './components/organisms/Toast';
import { useAuthStore } from './hooks/useAuthStore';
import { useAppStore } from './hooks/useAppStore';
import type { UserType } from './types';

type Route = 'welcome' | 'role-select' | 'login' | 'renter-onboarding' | 'landlord-onboarding' | 'agency-onboarding' | 'app';
type AppPage = 'swipe' | 'matches' | 'profile';

/**
 * Main App component with authentication and routing
 * Handles public routes (welcome, onboarding) and protected routes (app pages)
 */
function App() {
  const { isAuthenticated, userType, currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const { loadProperties } = useAppStore();

  const [currentRoute, setCurrentRoute] = useState<Route>('welcome');
  const [currentPage, setCurrentPage] = useState<AppPage>('swipe');
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);

  // Load properties from storage on app initialization
  useEffect(() => {
    console.log('[App] Initializing - loading properties...');
    loadProperties().then(() => {
      console.log('[App] Properties loaded');
    }).catch((err) => {
      console.error('[App] Failed to load properties:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Handle initial routing based on auth state
  useEffect(() => {
    if (isAuthenticated && currentUser?.onboardingComplete) {
      setCurrentRoute('app');
    } else if (isAuthenticated && !currentUser?.onboardingComplete) {
      // Route to appropriate onboarding based on user type
      let route: Route = 'renter-onboarding';
      if (userType === 'renter') {
        route = 'renter-onboarding';
      } else if (userType === 'landlord') {
        route = 'landlord-onboarding';
      } else if (userType === 'estate_agent' || userType === 'management_agency') {
        route = 'agency-onboarding';
      }
      setCurrentRoute(route);
    } else {
      // Check if user has visited before
      const hasVisited = localStorage.getItem('get-on-has-visited');
      if (hasVisited) {
        setCurrentRoute('role-select');
      } else {
        setCurrentRoute('welcome');
      }
    }
  }, [isAuthenticated, currentUser, userType]);

  const handleGetStarted = () => {
    localStorage.setItem('get-on-has-visited', 'true');
    setCurrentRoute('role-select');
  };

  const handleSelectRole = (role: UserType) => {
    setSelectedRole(role);
    // Route to appropriate onboarding
    let route: Route = 'renter-onboarding';
    if (role === 'renter') {
      route = 'renter-onboarding';
    } else if (role === 'landlord') {
      route = 'landlord-onboarding';
    } else if (role === 'estate_agent' || role === 'management_agency') {
      route = 'agency-onboarding';
    }
    setCurrentRoute(route);
  };

  const handleOnboardingComplete = () => {
    setCurrentRoute('app');

    // Show celebration toast
    const isRenter = selectedRole === 'renter';
    const isAgency = selectedRole === 'estate_agent' || selectedRole === 'management_agency';
    addToast({
      type: 'success',
      title: isRenter ? 'Welcome!' : 'Account Created!',
      message: isRenter
        ? 'Start swiping to find your perfect rental'
        : isAgency
        ? 'Your agency profile is ready - start managing properties'
        : 'You can now connect with interested renters',
      duration: 5000,
    });
  };

  const renderRoute = () => {
    switch (currentRoute) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={handleGetStarted} onLogin={() => setCurrentRoute('login')} />;

      case 'role-select':
        return (
          <RoleSelectionScreen
            onSelectRole={handleSelectRole}
            onLogin={() => setCurrentRoute('login')}
            onBack={() => setCurrentRoute('welcome')}
          />
        );

      case 'login':
        return (
          <LoginPage
            onBack={() => setCurrentRoute('role-select')}
            onLoginSuccess={() => setCurrentRoute('app')}
          />
        );

      case 'renter-onboarding':
        return <RenterOnboarding onComplete={handleOnboardingComplete} onLogin={() => setCurrentRoute('login')} />;

      case 'landlord-onboarding':
        return <LandlordOnboarding onComplete={handleOnboardingComplete} onLogin={() => setCurrentRoute('login')} />;

      case 'agency-onboarding':
        return (
          <AgencyOnboarding
            onComplete={handleOnboardingComplete}
            onLogin={() => setCurrentRoute('login')}
            initialAgencyType={
              selectedRole === 'estate_agent' ? 'estate_agent' : 'management_agency'
            }
          />
        );

      case 'app':
        return (
          <>
            <AnimatePresence mode="wait">
              {currentPage === 'swipe' && (
                <motion.div
                  key="swipe"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {userType === 'renter' ? (
                    <SwipePage />
                  ) : userType === 'estate_agent' || userType === 'management_agency' ? (
                    <AgencyDashboard />
                  ) : (
                    <LandlordDashboard />
                  )}
                </motion.div>
              )}
              {currentPage === 'matches' && (
                <motion.div
                  key="matches"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MatchesPage />
                </motion.div>
              )}
              {currentPage === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ProfilePage />
                </motion.div>
              )}
            </AnimatePresence>
            <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
          </>
        );

      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <>
      {renderRoute()}
      <ToastContainer />
    </>
  );
}

export default App;
