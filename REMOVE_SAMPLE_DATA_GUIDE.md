# 🗑️ How to Remove Hardcoded Notifications & Achievements

## Quick Guide to Clean Up Dashboard Sample Data

Your Dashboard currently shows **hardcoded sample data** for testing. Follow these simple steps to remove it and prepare for backend integration.

---

## 📝 **Step 1: Remove Notifications Sample Data**

**Find** (around line 219-266):
```javascript
  // Sample notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'announcement',
      title: 'New Course Available',
      // ... lots of sample data ...
    }
  ]);
```

**Replace with**:
```javascript
  // Notifications data (empty - ready for backend integration)
  const [notifications, setNotifications] = useState([]);
```

---

## 📝 **Step 2: Remove Achievements Sample Data**

**Find** (around line 346-401):
```javascript
  // Achievements data
  const [achievements, setAchievements] = useState([
    {
      id: 'ach-1',
      title: 'First Steps',
      // ... lots of sample data ...
    }
  ]);
```

**Replace with**:
```javascript
  // Achievements data (empty - ready for backend integration)
  const [achievements, setAchievements] = useState([]);
```

---

## ✅ **That's It!**

After making these changes:

1. **Notifications tab** will show: *"No notifications yet"*
2. **Achievements tab** will show: *"No achievements unlocked"*

Both tabs are now ready to receive real data from a backend API when you build it!

---

## 💡 **Why?**

- **Cleaner code** - No fake sample data
- **Ready for integration** - Empty arrays ready to populate from API
- **More professional** - Shows actual state (empty) instead of fake data

---

## 🔧 **Keep These Functions**

Don't remove these - they're needed for when you add backend:
- `markAsRead(id)`
- `markAllAsRead()`
- `deleteNotification(id)`
- `unreadCount` calculation

These will work automatically once you populate the arrays with real data!
