const pool = require('../config/db');

const postController = {
    getAllPosts: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();

            // Get all posts with user details
            const [posts] = await connection.query(
                `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
                FROM posts as p
                LEFT JOIN users as u 
                ON p.userId = u.id
                ORDER BY p.createdAt DESC`
            );

            const postsWithLikes = await Promise.all(
                posts.map(async (post) => {
                    const [likes] = await connection.query(
                        `SELECT * FROM likes WHERE postId = ?`, [post.id]
                    );

                    return {
                        _id: post.id,
                        content: post.content,
                        imgContent: post.imageUrl,
                        username: post.username,
                        firstName: post.firstName,
                        lastName: post.lastName,
                        email: post.email,
                        image: post.profileImage,
                        likes: {
                            likeCount: post.likeCount,
                            likedBy: likes.map(like => like.userId),
                        },
                        createdAt: post.createdAt,
                        updatedAt: post.updatedAt,
                    };
                })
            );

            connection.release();

            res.status(200).json({
                message: 'Posts fetched successfully',
                posts: postsWithLikes
            });
        } catch (error) {
            console.error('Get all posts error:', error);
            if (connection) connection.release();
            res.status(500).json({ message: 'Server error fetching posts', error: error.message });
        }
    },


    getTrendingPosts: async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Get trending posts (sorted by likeCount)
        const [posts] = await connection.query(
            `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
            FROM posts as p
            LEFT JOIN users as u 
            ON p.userId = u.id
            ORDER BY p.likeCount DESC, p.createdAt DESC`
        );
        
        const postsWithLikes = await Promise.all(
            posts.map(async (post) => {
                const [likes] = await connection.query(
                    `SELECT userId FROM likes WHERE postId = ?`, [post.id]
                );

                return {
                    _id: post.id,
                    content: post.content,
                    imgContent: post.imageUrl,
                    username: post.username,
                    firstName: post.firstName,
                    lastName: post.lastName,
                    email: post.email,
                    image: post.profileImage,
                    likes: {
                        likeCount: post.likeCount,
                        likedBy: likes.map(like => like.userId),
                    },
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                };
            })
        );

        connection.release();

        res.status(200).json({
            message: 'Trending posts fetched successfully',
            posts: postsWithLikes
        });
    } catch (error) {
        console.error('Get trending posts error:', error);
        if (connection) connection.release();
        res.status(500).json({ message: 'Server error fetching trending posts', error: error.message });
    }
}
};



module.exports = postController;
