const express = require('express');
const getFormAllByIdSubmissions = require('../middleware/getAllSubmitions');
const validateDateMatches = require('../controllers/validateDateMatches');
const router = express.Router();

router.post('/', 
    getFormAllByIdSubmissions,
    validateDateMatches
);

module.exports = router;
