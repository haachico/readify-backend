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
    }
}

module.exports = userController;