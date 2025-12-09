// Simple test file to verify API integration
import { progressAPI } from './progressAPI.js';

// Test function
export const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test getting stats (should work even without progress data)
    const stats = await progressAPI.getStats();
    console.log('Stats API test passed:', stats);
    
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
};

// Export for debugging
export default { testAPI };
