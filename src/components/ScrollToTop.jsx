import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Temporarily disable smooth scrolling
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const originalHtmlScrollBehavior = htmlElement.style.scrollBehavior;
    const originalBodyScrollBehavior = bodyElement.style.scrollBehavior;

    htmlElement.style.scrollBehavior = 'auto';
    bodyElement.style.scrollBehavior = 'auto';

    // Force scroll to top using multiple methods
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Restore scroll behavior after scrolling
    setTimeout(() => {
      htmlElement.style.scrollBehavior = originalHtmlScrollBehavior;
      bodyElement.style.scrollBehavior = originalBodyScrollBehavior;
    }, 100);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
