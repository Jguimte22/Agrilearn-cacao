// Patch MutationObserver as early as possible
(function() {
  try {
    if (!window.MutationObserver) return;
    
    // Save original MutationObserver
    const OriginalMutationObserver = window.MutationObserver;
    
    // Create a safe wrapper
    function SafeMutationObserver(callback) {
      if (typeof callback !== 'function') {
        console.warn('MutationObserver callback must be a function');
        return new OriginalMutationObserver(() => {});
      }
      
      const safeCallback = function(mutations, observer) {
        try {
          return callback(mutations, observer);
        } catch (e) {
          console.warn('MutationObserver callback error:', e);
          return undefined;
        }
      };
      
      return new OriginalMutationObserver(safeCallback);
    }
    
    // Copy static properties
    if (OriginalMutationObserver.prototype) {
      SafeMutationObserver.prototype = Object.create(OriginalMutationObserver.prototype);
    }
    
    // Replace the global MutationObserver
    window.MutationObserver = SafeMutationObserver;
    
    // Patch observe method
    if (OriginalMutationObserver.prototype && OriginalMutationObserver.prototype.observe) {
      const originalObserve = OriginalMutationObserver.prototype.observe;
      
      OriginalMutationObserver.prototype.observe = function(target, options) {
        try {
          if (!target || !(target instanceof Node)) {
            console.warn('Skipping MutationObserver.observe() on invalid target:', target);
            return;
          }
          
          // Check if the target is in the document
          if (document.documentElement && !document.documentElement.contains(target) && document.readyState !== 'loading') {
            console.warn('Skipping MutationObserver.observe() on detached node:', target);
            return;
          }
          
          return originalObserve.call(this, target, options);
        } catch (e) {
          console.warn('Error in MutationObserver.observe():', e);
        }
      };
    }
  } catch (e) {
    console.warn('Error patching MutationObserver:', e);
  }
})();

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);