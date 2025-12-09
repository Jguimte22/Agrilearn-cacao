const express = require('express');
const router = express.Router();

// Placeholder score routes - to be implemented later
router.get('/', (req, res) => {
  res.json({
    message: 'Score routes - coming soon',
    status: 'placeholder'
  });
});

module.exports = router;
