import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Handle any scrollable containers
    const scrollableElements = document.querySelectorAll('[style*="overflow"], .scrollable, .container, main, .main-content');
    scrollableElements.forEach(element => {
      if (element.scrollTop !== undefined) {
        element.scrollTop = 0;
      }
    });

    // Double-check after a short delay
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);
};

export default useScrollToTop;
