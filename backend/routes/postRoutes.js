const express = require('express');


const router = express.Router();
const {getAllPosts, getTrendingPosts} = require('../controllers/postController');


router.get('/', getAllPosts);
router.get('/trending', getTrendingPosts);

module.exports = router;