const express = require('express');
const { calculateGpa } = require('../controllers/gpaController');

const router = express.Router();

router.post('/', calculateGpa);

module.exports = router;
