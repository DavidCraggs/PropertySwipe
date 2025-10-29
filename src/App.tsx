import { useState } from 'react';
import { SwipePage } from './pages/SwipePage';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { BottomNav } from './components/organisms/BottomNav';
import { ToastContainer } from './components/organisms/Toast';

type Page = 'swipe' | 'matches' | 'profile';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('swipe');

  const renderPage = () => {
    switch (currentPage) {
      case 'swipe':
        return <SwipePage />;
      case 'matches':
        return <MatchesPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <SwipePage />;
    }
  };

  return (
    <>
      {renderPage()}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
      <ToastContainer />
    </>
  );
}

export default App;
