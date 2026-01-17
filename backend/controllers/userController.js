const pool = require('../config/db');
const { get } = require('../routes/authRoutes');


const userController = {
    

    getAllUsers : async (req, res) => {

        try {
            const connection =  await pool.getConnection();
            const [users] = await connection.query(
                'SELECT * FROM users ORDER BY username ASC'
            )

            connection.release();

            res.status(200).json({
                message: 'Users fetched successfully',
                users: users
            })
        }
        catch(error){
            res.status(500).json({ message: 'Server error fetching users', error: error.message });
        }
    },

    getUserByUsername: async (req, res) => {
        let connection;
        try {
            const { username } = req.params;
            connection = await pool.getConnection();
            const [users] = await connection.query(
                `SELECT 
                  u.*,
                  COUNT(DISTINCT f1.id) as followers,
                  COUNT(DISTINCT f2.id) as followings
                FROM users as u 
                LEFT JOIN follows f1 ON f1.followingId = u.id
                LEFT JOIN follows f2 ON f2.followerId = u.id
                WHERE u.username = ?
                GROUP BY u.id`, 
                [username]
            )
            if (users.length === 0) {
                connection.release();
                return  res.status(404).json({ message: 'User not found' });
            }

            const user = users[0];

            connection.release();
            res.status(200).json({
                message: 'User fetched successfully',
                user: user
            })


        }        catch (error) {
            console.error('Get user by username error:', error);
            if (connection) connection.release();
            res.status(500).json({ message: 'Server error fetching user', error: error.message });
        }
    },

    searchUsers: async (req, res) => {
        let connection;
        try {
            const { query } = req.query;
            
            if (!query || query.trim() === '') {
                return res.status(200).json({
                    message: 'No search query provided',
                    users: []
                });
            }

            connection = await pool.getConnection();
            const [users] = await connection.query(
                `SELECT * FROM users 
                 WHERE username LIKE ? OR firstName LIKE ? OR lastName LIKE ? 
                 ORDER BY username ASC 
                 LIMIT 10`,
                [`%${query}%`, `%${query}%`, `%${query}%`]
            );

            connection.release();

            res.status(200).json({
                message: 'Users found',
                users: users
            });
        } catch (error) {
            console.error('Search users error:', error);
            if (connection) connection.release();
            res.status(500).json({ message: 'Server error searching users', error: error.message });
        }
    },

     followUser: async (req, res) => {
         try {

            const followerId = req.auth.userId;
            const { followingId } = req.body;
            if (followerId === followingId) {
                return res.status(400).json({ message: 'You cannot follow yourself' });
            }
        
          const connection = await pool.getConnection();
            const [existingFollow] = await connection.query(
                'SELECT id FROM follows WHERE followerId = ? AND followingId = ?',
                [followerId, followingId]
            );

            if (existingFollow.length > 0) {
               
                await connection.query(
                    'DELETE FROM follows WHERE followerId = ? AND followingId = ?',
                    [followerId, followingId]
                );
            } else {
                await connection.query(
                    'INSERT INTO follows (followerId, followingId) VALUES (?, ?)',
                    [followerId, followingId]
                );
            }
            connection.release();
            return res.status(200).json({ message: 'Follow/unfollow action completed successfully' });
         }
         catch (error) {
           console.error('Follow user error:', error);
           return res.status(500).json({ message: 'Server error during follow user' });
         }

    },

    updateProfile: async (req, res) => {
        try {
            const userId = req.auth.userId;

            const { profileImage, about, link } = req.body;

            const connection = await pool.getConnection();
           
            await connection.query(
                'UPDATE users SET profileImage = ?, about = ?, link = ? WHERE id = ?',
                [profileImage, about, link, userId]
            );

            connection.release();

            res.status(200).json({ message: 'Profile updated successfully' });
        }
        catch(error) {
            console.error('Update profile error:', error);
            res.status(500).json({ message: 'Server error updating profile', error: error.message });
        }
    }
}

module.exports = userController;