import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { RoleSelectionScreen } from './pages/RoleSelectionScreen';
import { BuyerOnboarding } from './pages/BuyerOnboarding';
import { VendorOnboarding } from './pages/VendorOnboarding';
import { SwipePage } from './pages/SwipePage';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { BottomNav } from './components/organisms/BottomNav';
import { ToastContainer, useToastStore } from './components/organisms/Toast';
import { useAuthStore } from './hooks/useAuthStore';
import type { UserType } from './types';

type Route = 'welcome' | 'role-select' | 'buyer-onboarding' | 'vendor-onboarding' | 'app';
type AppPage = 'swipe' | 'matches' | 'profile';

/**
 * Main App component with authentication and routing
 * Handles public routes (welcome, onboarding) and protected routes (app pages)
 */
function App() {
  const { isAuthenticated, userType, currentUser } = useAuthStore();
  const { addToast } = useToastStore();

  const [currentRoute, setCurrentRoute] = useState<Route>('welcome');
  const [currentPage, setCurrentPage] = useState<AppPage>('swipe');
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);

  // Handle initial routing based on auth state
  useEffect(() => {
    if (isAuthenticated && currentUser?.isComplete) {
      setCurrentRoute('app');
    } else if (isAuthenticated && !currentUser?.isComplete) {
      setCurrentRoute(userType === 'buyer' ? 'buyer-onboarding' : 'vendor-onboarding');
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
    setCurrentRoute(role === 'buyer' ? 'buyer-onboarding' : 'vendor-onboarding');
  };

  const handleOnboardingComplete = () => {
    setCurrentRoute('app');

    // Show celebration toast
    addToast({
      type: 'success',
      title: selectedRole === 'buyer' ? 'Welcome!' : 'Account Created!',
      message: selectedRole === 'buyer'
        ? 'Start swiping to find your perfect home'
        : 'You can now connect with interested buyers',
      duration: 5000,
    });
  };

  const renderRoute = () => {
    switch (currentRoute) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={handleGetStarted} />;

      case 'role-select':
        return (
          <RoleSelectionScreen
            onSelectRole={handleSelectRole}
            onBack={() => setCurrentRoute('welcome')}
          />
        );

      case 'buyer-onboarding':
        return <BuyerOnboarding onComplete={handleOnboardingComplete} />;

      case 'vendor-onboarding':
        return <VendorOnboarding onComplete={handleOnboardingComplete} />;

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
                  <SwipePage />
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
