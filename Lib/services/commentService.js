import Comment from '../models/Comment.js';
import Blog from '../models/Blog.js';
import AppError from '../utils/AppError.js';

class CommentService {
  static async addComment(userId, blogId, content, parentCommentId = null) {
    if (!content || !content.trim()) {
      throw new AppError('Comment content is required', 400);
    }

    const blog = await Blog.findById(blogId);
    if (!blog || !blog.isPublished) {
      throw new AppError('Blog not found or not published', 404);
    }

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.targetType !== 'blog' || parentComment.targetId.toString() !== blogId) {
        throw new AppError('Parent comment not found', 404);
      }
    }

    const comment = await Comment.create({
      author: userId,
      content,
      targetType: 'blog',
      targetId: blogId,
      parent: parentCommentId || null,
      status: 'visible',
    });

    await Blog.findByIdAndUpdate(blogId, { $inc: { commentCount: 1 } });

    return comment.populate('author', 'fullName publicUsername avatarUrl');
  }

  static async listComments(blogId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {
      targetType: 'blog',
      targetId: blogId,
      parent: null,
      status: 'visible',
    };

    const comments = await Comment.find(filter)
      .populate('author', 'fullName publicUsername avatarUrl')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const replies = await Comment.find({
      targetType: 'blog',
      targetId: blogId,
      parent: { $ne: null },
      status: 'visible',
    })
      .populate('author', 'fullName publicUsername avatarUrl')
      .sort({ createdAt: 1 });

    const repliesMap = {};
    replies.forEach((reply) => {
      const parentId = reply.parent.toString();
      if (!repliesMap[parentId]) {
        repliesMap[parentId] = [];
      }
      repliesMap[parentId].push(reply);
    });

    comments.forEach((comment) => {
      comment.replies = repliesMap[comment._id.toString()] || [];
    });

    const total = await Comment.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return { comments, total, pages, currentPage: page };
  }

  static async likeComment(commentId) {
    const comment = await Comment.findByIdAndUpdate(commentId, { $inc: { votes: 1 } }, { new: true }).populate(
      'author',
      'fullName publicUsername avatarUrl'
    );

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    return comment;
  }

  static async deleteComment(commentId, userId) {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.author.toString() !== userId) {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    const blogId = comment.targetId;
    await Comment.findByIdAndDelete(commentId);
    await Blog.findByIdAndUpdate(blogId, { $inc: { commentCount: -1 } });

    return { message: 'Comment deleted successfully' };
  }

  static async getReplies(commentId) {
    const replies = await Comment.find({
      parent: commentId,
      status: 'visible',
    })
      .populate('author', 'fullName publicUsername avatarUrl')
      .sort({ createdAt: 1 });

    return replies;
  }
}

export default CommentService;
