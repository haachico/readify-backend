const pool = require('../config/db');


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
    }
}

module.exports = userController;