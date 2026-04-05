import CommentService from '../services/commentService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

export const addComment = catchAsync(async (req, res) => {
  const blogId = req.params.id;
  const { content, parentCommentId } = req.body;
  if (!content || !content.trim()) throw new AppError('Comment content is required', 400);
  const comment = await CommentService.addComment(req.user.id, blogId, content, parentCommentId);
  res.status(201).json({ message: 'Comment added successfully', data: comment });
});

export const listComments = catchAsync(async (req, res) => {
  const result = await CommentService.listComments(req.params.id, { page: req.query.page, limit: req.query.limit });
  res.json({
    message: 'Comments retrieved successfully',
    data: result.comments,
    pagination: { currentPage: result.currentPage, pages: result.pages, total: result.total },
  });
});

export const likeComment = catchAsync(async (req, res) => {
  const comment = await CommentService.likeComment(req.params.commentId);
  res.json({ message: 'Comment liked successfully', data: comment });
});

export const deleteComment = catchAsync(async (req, res) => {
  await CommentService.deleteComment(req.params.commentId, req.user.id);
  res.json({ message: 'Comment deleted successfully' });
});
