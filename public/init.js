// Global initialization script - runs before any React code
// This prevents "Cannot convert undefined or null to object" errors

(function() {
  'use strict';

  // Ensure process.env exists in browser environment
  if (typeof window !== 'undefined') {
    // Initialize process object if it doesn't exist
    if (typeof window.process === 'undefined') {
      window.process = {
        env: {}
      };
    } else if (!window.process.env) {
      window.process.env = {};
    }

    // Set default environment variables
    const defaults = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_NAME: 'Grid World',
      NEXT_PUBLIC_APP_URL: window.location.origin,
      NEXT_PUBLIC_CONTACT_EMAIL: 'contact@gridworld.com'
    };

    // Apply defaults for missing variables
    Object.keys(defaults).forEach(function(key) {
      if (!window.process.env[key]) {
        window.process.env[key] = defaults[key];
      }
    });

    console.log('✅ Environment initialized');
  }
})();
