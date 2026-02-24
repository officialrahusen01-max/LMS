import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as blogController from '../controllers/blogController.js';
import * as commentController from '../controllers/commentController.js';

const router = express.Router();
// Public routes
router.get('/', blogController.listBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.post('/:id/like', blogController.likeBlog);

// Protected routes - authenticated users
router.get('/:id', authenticate, blogController.getBlog);

// Instructor/Admin only
router.post('/', authenticate, authorize(['instructor', 'admin']), blogController.createBlog);
router.put('/:id', authenticate, authorize(['instructor', 'admin']), blogController.updateBlog);
router.delete('/:id', authenticate, authorize(['instructor', 'admin']), blogController.deleteBlog);
router.post('/:id/publish', authenticate, authorize(['instructor', 'admin']), blogController.publishBlog);
router.post('/:id/unpublish', authenticate, authorize(['instructor', 'admin']), blogController.unpublishBlog);
router.get('/me/articles', authenticate, authorize(['instructor', 'admin']), blogController.getAuthorBlogs);

// Public routes - list comments
router.get('/:id/comments', commentController.listComments);

// Protected routes - add comment
router.post('/:id/comments', authenticate, commentController.addComment);

// Comment management
router.post('/comments/:commentId/like', commentController.likeComment);
router.delete('/comments/:commentId', authenticate, commentController.deleteComment);

export default router;
