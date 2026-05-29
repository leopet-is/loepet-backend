const express = require('express');
const { AsyncWrapper } = require('../helpers');
const testController = require('../controllers/testController');
const passport = require('../middlewares/passport');

const router = express.Router();

router.post('/clear-db', AsyncWrapper(testController.clearDatabase));
router.post('/create-donation', passport, AsyncWrapper(testController.createDonation));

module.exports = router;
