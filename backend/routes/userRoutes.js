const express = require('express');


const router = express.Router();

const {getAllUsers, getUserByUsername} = require('../controllers/userController');


router.get('/', getAllUsers);
router.get('/:username', getUserByUsername);

module.exports = router;