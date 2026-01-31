const userService = require('../services/userService');

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const result = await userService.getAllUsers();
      res.status(200).json(result);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Server error fetching users', error: error.message });
    }
  },

  getUserByUsername: async (req, res) => {
    try {
      const { username } = req.params;
      const result = await userService.getUserByUsername(username);
      res.status(200).json(result);
    } catch (error) {
      console.error('Get user by username error:', error);
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Server error fetching user', error: error.message });
    }
  },

  searchUsers: async (req, res) => {
    try {
      const { query } = req.query;
      const result = await userService.searchUsers(query);
      res.status(200).json(result);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: 'Server error searching users', error: error.message });
    }
  },

  followUser: async (req, res) => {
    try {
      const followerId = req.auth.userId;
      const { followingId } = req.body;
      const result = await userService.followUser(followerId, followingId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Follow user error:', error);
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Server error during follow user', error: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.auth.userId;
      const { profileImage, about, link } = req.body;
      const result = await userService.updateProfile(userId, profileImage, about, link);
      res.status(200).json(result);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error updating profile', error: error.message });
    }
  },

  getFollowersList : async (req, res) => {
    try {

      const { userId } = req.params;
      const result = await userService.getFollowers(userId);
      res.status(200).json(result);
    }
    catch(error){
      console.error('Get followers list error:', error);
      res.status(500).json({ message: 'Server error fetching followers list', error: error.message });
    }
  },

  getFollowingsList : async (req, res) => {
    try {

      const { userId } = req.params;
      const result = await userService.getFollowings(userId);
      res.status(200).json(result);

    }
    catch(error){
      console.error('Get followings list error:', error);
      res.status(500).json({ message: 'Server error fetching followings list', error: error.message });
  }
}
};

module.exports = userController;
