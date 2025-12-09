// public/mutation-observer-patch.js
(function() {
    // Don't run in Node.js or other non-browser environments
    if (typeof window === 'undefined' || !window.document) {
        return;
    }

    // Save the original MutationObserver
    const OriginalMutationObserver = window.MutationObserver;
    
    // If MutationObserver doesn't exist, provide a no-op implementation
    if (!OriginalMutationObserver) {
        window.MutationObserver = class {
            constructor() {
                return {
                    observe: () => {},
                    disconnect: () => {},
                    takeRecords: () => []
                };
            }
        };
        return;
    }

    // Create a safe wrapper
    function SafeMutationObserver(callback) {
        if (!(this instanceof SafeMutationObserver)) {
            return new SafeMutationObserver(callback);
        }

        // If no callback is provided, return a no-op observer
        if (typeof callback !== 'function') {
            return {
                observe: () => {},
                disconnect: () => {},
                takeRecords: () => []
            };
        }

        const safeCallback = function(mutations, observer) {
            try {
                return callback(mutations, observer);
            } catch (e) {
                console.debug('MutationObserver callback error:', e);
                return null;
            }
        };

        try {
            return new OriginalMutationObserver(safeCallback);
        } catch (e) {
            console.debug('Error creating SafeMutationObserver:', e);
            return {
                observe: () => {},
                disconnect: () => {},
                takeRecords: () => []
            };
        }
    }

    // Copy the prototype
    SafeMutationObserver.prototype = OriginalMutationObserver.prototype;

    // Replace the global MutationObserver
    window.MutationObserver = SafeMutationObserver;

    // Patch the observe method
    const originalObserve = OriginalMutationObserver.prototype.observe;
    
    function isNode(target) {
        // Check if target is a valid Node
        try {
            // This will throw an error if target is not a valid Node
            return target instanceof Node && 
                   target.nodeType >= Node.ELEMENT_NODE && 
                   target.nodeType <= Node.DOCUMENT_NODE;
        } catch (e) {
            return false;
        }
    }

    function isInDocument(target) {
        try {
            return document.body && document.body.contains(target);
        } catch (e) {
            return false;
        }
    }

    OriginalMutationObserver.prototype.observe = function(target, options) {
        // Check if target is valid
        if (!isNode(target) || !isInDocument(target)) {
            console.debug('MutationObserver.observe called with invalid target:', target);
            return;
        }

        // Ensure options is an object if provided
        if (options && typeof options !== 'object') {
            options = {};
        }

        try {
            return originalObserve.call(this, target, options || {});
        } catch (e) {
            console.debug('Error in MutationObserver.observe:', e);
            return null;
        }
    };

    // Also patch the disconnect method to prevent errors
    const originalDisconnect = OriginalMutationObserver.prototype.disconnect;
    OriginalMutationObserver.prototype.disconnect = function() {
        try {
            return originalDisconnect.call(this);
        } catch (e) {
            console.debug('Error in MutationObserver.disconnect:', e);
            return null;
        }
    };

    // Patch takeRecords as well for completeness
    const originalTakeRecords = OriginalMutationObserver.prototype.takeRecords;
    OriginalMutationObserver.prototype.takeRecords = function() {
        try {
            return originalTakeRecords.call(this) || [];
        } catch (e) {
            console.debug('Error in MutationObserver.takeRecords:', e);
            return [];
        }
    };
})();
