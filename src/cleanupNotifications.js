// Run this in the browser console to clean up old notifications from localStorage
// Just paste this into the browser console and press Enter

console.log('🧹 Starting notification cleanup...');

// Clear all notification-related localStorage items
const keysToRemove = [];

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.includes('Notification') ||
    key.includes('notification') ||
    key === 'seenAchievements'
  )) {
    keysToRemove.push(key);
  }
}

console.log('Found keys to remove:', keysToRemove);

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log('Removed:', key);
});

console.log('✅ Cleanup complete! Refresh the page to fetch fresh notifications from the backend.');
console.log('Total items removed:', keysToRemove.length);
