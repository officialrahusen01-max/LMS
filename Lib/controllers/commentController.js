import CommentService from '../services/commentService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const addComment = catchAsync(async (req, res) => {
  const { id: blogId } = req.params;
  const { content, parentCommentId } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    throw new AppError('Comment content is required', 400);
  }

  const comment = await CommentService.addComment(userId, blogId, content, parentCommentId);

  res.status(201).json({
    message: 'Comment added successfully',
    data: comment,
  });
});

export const listComments = catchAsync(async (req, res) => {
  const { id: blogId } = req.params;
  const { page, limit } = req.query;

  const result = await CommentService.listComments(blogId, { page, limit });

  res.json({
    message: 'Comments retrieved successfully',
    data: result.comments,
    pagination: {
      currentPage: result.currentPage,
      pages: result.pages,
      total: result.total,
    },
  });
});

export const likeComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;

  const comment = await CommentService.likeComment(commentId);

  res.json({
    message: 'Comment liked successfully',
    data: comment,
  });
});

export const deleteComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  await CommentService.deleteComment(commentId, userId);

  res.json({
    message: 'Comment deleted successfully',
  });
});
