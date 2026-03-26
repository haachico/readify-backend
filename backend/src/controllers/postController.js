const postService = require("../services/postService");
const Logger = require("../utils/logger");

const postController = {
  getAllPosts: async (req, res) => {
    const { page, limit } = req.query;
    try {
      const result = await postService.getAllPosts(page, limit);
      res.status(200).json(result);
    } catch (error) {
      console.error("Get all posts error:", error);
      res
        .status(500)
        .json({ message: "Server error fetching posts", error: error.message });
    }
  },

  getPostDetailsById: async (req, res) => {
    try {
      const { postId } = req.params;
      const result = await postService.getPostById(postId);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching post details",
        error: error.message,
      });
    }
  },

  getPostsByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await postService.getPostsByUserId(userId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Get posts by user ID error:", error);
      res.status(500).json({
        message: "Server error fetching posts by user ID",
        error: error.message,
      });
    }
  },

  getTrendingPosts: async (req, res) => {
    try {

      const { page, limit } = req.query;
      const result = await postService.getTrendingPosts(page, limit);
      res.status(200).json(result);
    } catch (error) {
      console.error("Get trending posts error:", error);
      res.status(500).json({
        message: "Server error fetching trending posts",
        error: error.message,
      });
    }
  },

  getFeedPosts: async (req, res) => {
    try {
      const userId = req.auth.userId;
      const { page, limit, sort } = req.query;
      const result = await postService.getFeedPosts(userId, page, limit, sort);
      res.status(200).json(result);
    } catch (error) {
      console.error("Get feed posts error:", error);
      res.status(500).json({
        message: "Server error fetching feed posts",
        error: error.message,
      });
    }
  },

  getBookmarkedPosts: async (req, res) => {
    try {
      const userId = req.auth.userId;
      const { page, limit } = req.query;
      const result = await postService.getBookmarkedPosts(userId, page, limit);
      res.status(200).json(result);
    } catch (error) {
      console.error("Get bookmarked posts error:", error);
      res.status(500).json({
        message: "Server error fetching bookmarked posts",
        error: error.message,
      });
    }
  },

  createPost: async (req, res) => {
    try {
      console.log("===== CREATE POST DEBUG =====");
      console.log("req.file:", req.file);
      console.log("req.body:", req.body);
      console.log("req.headers content-type:", req.headers["content-type"]);
      console.log("=============================");
      const { content } = req.body;
      const imgContent = req.file ? req.file.imageUrl : null;
      const userId = req.auth.userId;
      const result = await postService.createPost(content, imgContent, userId);
      await Logger.logInfo(
        `User created post`,
        `/api/posts`,
        "POST",
        req.ipAddress,
        201,
        { userId, postId: result.postId },
      );
      res.status(201).json(result);
    } catch (error) {
      console.error("Create post error:", error);
      await Logger.logError(
        `Failed to create post`,
        `/api/posts`,
        "POST",
        req.ipAddress,
        500,
        error,
      );
      res
        .status(500)
        .json({ message: "Server error creating post", error: error.message });
    }
  },

  editPost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const imgContent = req.file ? req.file.imageUrl : null;

      const userId = req.auth.userId;
      const result = await postService.editPost(
        postId,
        userId,
        content,
        imgContent,
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Edit post error:", error);
      const status = error.status || 500;
      res.status(status).json({
        message: error.message || "Server error editing post",
        error: error.message,
      });
    }
  },

  bookmarkPost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.bookmarkPost(postId, userId);
      await Logger.logInfo(
        `User bookmarked post`,
        `/api/posts/:postId/bookmark`,
        "POST",
        req.ipAddress,
        200,
        { userId, postId },
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Bookmark post error:", error);
      await Logger.logError(
        `Failed to bookmark post`,
        `/api/posts/:postId/bookmark`,
        "POST",
        req.ipAddress,
        500,
        error,
      );
      res.status(500).json({
        message: "Server error bookmarking post",
        error: error.message,
      });
    }
  },

  removeBookmark: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.removeBookmark(postId, userId);
      await Logger.logInfo(
        `User removed bookmark from post`,
        `/api/posts/:postId/bookmark`,
        "DELETE",
        req.ipAddress,
        200,
        { userId, postId },
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Remove bookmark error:", error);
      await Logger.logError(
        `Failed to remove bookmark`,
        `/api/posts/:postId/bookmark`,
        "DELETE",
        req.ipAddress,
        500,
        error,
      );
      res.status(500).json({
        message: "Server error removing bookmark",
        error: error.message,
      });
    }
  },

  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.deletePost(postId, userId);
      await Logger.logInfo(
        `User deleted post`,
        `/api/posts/:postId`,
        "DELETE",
        req.ipAddress,
        200,
        { userId, postId },
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Delete post error:", error);
      const status = error.status || 500;
      await Logger.logError(
        `Failed to delete post`,
        `/api/posts/:postId`,
        "DELETE",
        req.ipAddress,
        status,
        error,
      );
      res.status(status).json({
        message: error.message || "Server error deleting post",
        error: error.message,
      });
    }
  },

  handleLikeDislike: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.auth.userId;
      const result = await postService.handleLikeDislike(postId, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Like/Dislike post error:", error);
      res.status(500).json({
        message: "Server error handling like/dislike",
        error: error.message,
      });
    }
  },
};

module.exports = postController;
