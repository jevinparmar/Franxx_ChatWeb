import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import Loader from './components/common/Loader';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Prevent scrolling while the loader is visible
    document.body.style.overflow = 'hidden';

    // Keep loader visible for ~2.5 seconds
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      
      // Wait for the 500ms fade-out transition before unmounting
      const fadeTimer = setTimeout(() => {
        setIsLoading(false);
        // Restore scrolling when loading is complete
        document.body.style.overflow = '';
      }, 500);
      
      return () => clearTimeout(fadeTimer);
    }, 2500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {isLoading && (
        <div
          style={{
            opacity: isFadingOut ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999, // Ensure highest z-index
            backgroundColor: '#050814', // Match loader fullscreen bg to prevent flashes
            pointerEvents: 'none', // Allow clicking elements behind during fade out
          }}
        >
          <Loader fullscreen />
        </div>
      )}
      {!isFadingOut && isLoading ? null : (
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <SocketProvider>
                <AppRoutes />
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      )}
    </>
  );
}

export default App;
