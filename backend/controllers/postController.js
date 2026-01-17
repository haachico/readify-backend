const pool = require('../config/db');

const postController = {
    getAllPosts: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();

            const [posts] = await connection.query(
                `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount,  p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
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
},


 getFeedPosts: async(req, res) => {

    try {

        const userId = req.auth.userId; // From authMiddleware

        const {sort} = req.query;

        let orderBy = 'p.createdAt ASC';

        if(sort === 'latest') {
            orderBy = 'p.createdAt DESC';
        }
        if (sort === 'trending') {
            orderBy = 'p.likeCount DESC';
        }

        const connection = await pool.getConnection();

           const [posts] = await connection.query(
            `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage, case when b.id is not null then 1 else 0 end as isBookmarked
            FROM posts p
            LEFT JOIN users u ON p.userId = u.id
            LEFT JOIN bookmarks b ON p.id = b.postId AND b.userId = ?
            WHERE p.userId = ? OR p.userId IN (
                SELECT followingId FROM follows WHERE followerId = ?
            )
            ORDER BY ${orderBy}`,
            [userId, userId, userId]
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
                        isBookmarked: post.isBookmarked === 1,
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
                message: 'Feed posts fetched successfully',
                posts: postsWithLikes
            });
    }
    catch (error) {
        console.error('Get feed posts error:', error);
        res.status(500).json({ message: 'Server error fetching feed posts', error: error.message });
    }
 },


    getBookmarkedPosts: async (req, res) => {
        let connection;
        try {
            const userId = req.auth.userId; // From authMiddleware
            connection = await pool.getConnection();
            

            const [posts] = await connection.query(
                `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
                FROM posts p
                INNER JOIN bookmarks b ON p.id = b.postId AND b.userId = ?
                LEFT JOIN users u ON p.userId = u.id
                ORDER BY b.createdAt DESC`, 
                [userId]
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
                        isBookmarked: true,
                    };
                })
            );

            connection.release();

            res.status(200).json({
                message: 'Bookmarked posts fetched successfully',
                posts: postsWithLikes
            });
        } catch(error) {
            console.error('Get bookmarked posts error:', error);
            if (connection) connection.release();
            res.status(500).json({ message: 'Server error fetching bookmarked posts', error: error.message });
        }
    },

    createPost : async (req, res) => {
    
        try {

           const {content, imgContent} = req.body;
              const userId = req.auth.userId;
            const connection = await pool.getConnection();

            const [result ] = await connection.query(
                `INSERT INTO posts (content, imageUrl, userId, likeCount, createdAt, updatedAt) VALUES (?, ?, ?, 0, NOW(), NOW())`,
                [content, imgContent, userId]
            )

             const [posts] = await connection.query(
                `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
                FROM posts as p
                LEFT JOIN users as u
                ON p.userId = u.id
                Where p.userId = ?
                ORDER BY p.createdAt DESC
                LIMIT 1`, 
                [userId]
             )


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

            res.status(201).json({
                message: 'Post created successfully',
                posts:  postsWithLikes
            });
        }

        catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ message: 'Server error creating post', error: error.message });
        }

    },


    editPost : async (req, res) => {
        try {
        
            const { postId } = req.params;
            const { content, imgContent } = req.body;
            const userId = req.auth.userId;
         
            const connection = await pool.getConnection();

            const [posts] = await connection.query(
                `SELECT * FROM posts WHERE id = ? AND userId = ?`, 
                [postId, userId]
            )

            if (posts.length === 0) {
                connection.release();
                return res.status(403).json({ message: 'Post not found or unauthorized' });
            }

            await connection.query(
                `UPDATE posts SET content = ?, imageUrl = ?, updatedAt = NOW() WHERE id = ?`,
                [content, imgContent, postId]
            );


            res.status(200).json({ message: 'Post updated successfully' });

            connection.release();

        }
        catch (error) {
            console.error('Edit post error:', error);
            res.status(500).json({ message: 'Server error editing post', error: error.message });
        }
    },

    bookmarkPost: async (req, res) => {
   
        try {

            const { postId } = req.params;
            const userId = req.auth.userId;

            const connection = await pool.getConnection();
            
            await connection.query(
                `INSERT INTO bookmarks (userId, postId, createdAt) VALUES (?, ?, NOW())`,
                [userId, postId]
            );

            connection.release();


            res.status(200).json({ message: 'Post bookmarked successfully' });

        }
        catch(error){
            console.error('Bookmark post error:', error);
            res.status(500).json({ message: 'Server error bookmarking post', error: error.message });
        }
          
    },

    removeBookmark: async (req, res) => {
        try {

            const { postId } = req.params;
            const userId = req.auth.userId;
            const connection = await pool.getConnection();

            await connection.query(
                `DELETE FROM bookmarks WHERE userId = ? AND postId = ?`,
                [userId, postId]
            );

            connection.release();
            res.status(200).json({ message: 'Bookmark removed successfully' });
        }
        catch(error){
            console.error('Remove bookmark error:', error);
            res.status(500).json({ message: 'Server error removing bookmark', error: error.message });
        }
    },

    deletePost : async (req, res) => {
        try {
            const { postId } = req.params;
            const userId = req.auth.userId;
    
            const connection = await pool.getConnection();

            const [posts] = await connection.query(
                `SELECT * FROM posts WHERE id = ? AND userId = ?`, 
                [postId, userId]
            )

            if (posts.length === 0) {
                connection.release();
                return res.status(403).json({ message: 'Post not found or unauthorized' });
            }

            await connection.query(
                `DELETE FROM posts WHERE id = ? AND userId = ?`,
                [postId, userId]
            );

            connection.release();

            res.status(200).json({ message: 'Post deleted successfully' });

        }
        catch(error){
                    console.error('Delete post error:', error);
                    res.status(500).json({ message: 'Server error deleting post', error: error.message });
                }
            },


        handleLikeDislike: async (req, res) => {
        try {
            const { postId } = req.params;
            const userId = req.auth.userId;
            const connection = await pool.getConnection();  

            const [likes] = await connection.query(
                `SELECT * FROM likes WHERE postId = ? AND userId = ?`,
                [postId, userId]
            );

            if (likes.length > 0) {
                await connection.query(
                    `DELETE FROM likes WHERE postId = ? AND userId = ?`,
                    [postId, userId]
                );
                await connection.query(
                    `UPDATE posts SET likeCount = likeCount - 1 WHERE id = ?`,
                    [postId]
                );
            } else {
                await connection.query(
                    `INSERT INTO likes (postId, userId, createdAt) VALUES (?, ?, NOW())`,
                    [postId, userId]
                );
                await connection.query(
                    `UPDATE posts SET likeCount = likeCount + 1 WHERE id = ?`,
                    [postId]
                );
            }
            connection.release();
            res.status(200).json({ message: 'Like/Dislike handled successfully' });
         }   
        catch (error) {
            console.error('Like/Dislike post error:', error);
            res.status(500).json({ message: 'Server error handling like/dislike', error: error.message });
        }
    }

    }



module.exports = postController;
