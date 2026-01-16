const express = require('express');


const router = express.Router();

const {getAllUsers, getUserByUsername, followUser} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/', getAllUsers);
router.post('/follow', authMiddleware, followUser);
router.get('/:username', getUserByUsername);

module.exports = router;