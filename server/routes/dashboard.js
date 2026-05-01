const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

module.exports = router;
