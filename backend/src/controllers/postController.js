const postService = require('../services/postService');

const postController = {
  getAllPosts: async (req, res) => {
    try {
      const result = await postService.getAllPosts();
      res.status(200).json(result);
    } catch (error) {
      console.error('Get all posts error:', error);
      res.status(500).json({ message: 'Server error fetching posts', error: error.message });
    }
  },

  getPostDetailsById : async (req, res) => {

    try {

      const { postId } = req.params;
      const result = await postService.getPostById(postId);
      
      res.status(200).json(result);

    }
    catch(error){
        res.status(500).json({ message: 'Server error fetching post details', error: error.message });
    }
  },

  getTrendingPosts: async (req, res) => {
    try {
      const result = await postService.getTrendingPosts();
      res.status(200).json(result);
    } catch (error) {
      console.error('Get trending posts error:', error);
      res.status(500).json({ message: 'Server error fetching trending posts', error: error.message });
    }
  },

  getFeedPosts: async (req, res) => {
    try {
      const userId = req.auth.userId;
      const { sort } = req.query;
      const result = await postService.getFeedPosts(userId, sort);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get feed posts error:', error);
      res.status(500).json({ message: 'Server error fetching feed posts', error: error.message });
    }
  },

  getBookmarkedPosts: async (req, res) => {
    try {
      const userId = req.auth.userId;
      const result = await postService.getBookmarkedPosts(userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get bookmarked posts error:', error);
      res.status(500).json({ message: 'Server error fetching bookmarked posts', error: error.message });
    }
  },

  createPost: async (req, res) => {
    try {
      const { content, imgContent } = req.body;
      const userId = req.auth.userId;
      const result = await postService.createPost(content, imgContent, userId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ message: 'Server error creating post', error: error.message });
    }
  },

  editPost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { content, imgContent } = req.body;
      const userId = req.auth.userId;
      const result = await postService.editPost(postId, userId, content, imgContent);
      res.status(200).json(result);
    } catch (error) {
      console.error('Edit post error:', error);
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Server error editing post', error: error.message });
    }
  },

  bookmarkPost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.bookmarkPost(postId, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Bookmark post error:', error);
      res.status(500).json({ message: 'Server error bookmarking post', error: error.message });
    }
  },

  removeBookmark: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.removeBookmark(postId, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Remove bookmark error:', error);
      res.status(500).json({ message: 'Server error removing bookmark', error: error.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.deletePost(postId, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Delete post error:', error);
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Server error deleting post', error: error.message });
    }
  },

  handleLikeDislike: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.handleLikeDislike(postId, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Like/Dislike post error:', error);
      res.status(500).json({ message: 'Server error handling like/dislike', error: error.message });
    }
  }
};

module.exports = postController;
