import Blog from '../models/Blog.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

class BlogService {
  static generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static async createBlog(userId, data) {
    const { title, content, tags = [] } = data;

    if (!title || !content) {
      throw new AppError('Title and content are required', 400);
    }

    const slug = this.generateSlug(title);
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      throw new AppError('Blog slug already exists', 400);
    }

    const blog = await Blog.create({
      title,
      content,
      slug,
      tags,
      author: userId,
      isPublished: false,
    });

    return blog.populate('author', 'fullName publicUsername avatarUrl');
  }

  static async publishBlog(blogId, userId) {
    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    if (blog.author.toString() !== userId) {
      throw new AppError('Not authorized to publish this blog', 403);
    }

    if (blog.isPublished) {
      throw new AppError('Blog is already published', 400);
    }

    blog.isPublished = true;
    blog.publishedAt = new Date();
    await blog.save();

    return blog.populate('author', 'fullName publicUsername avatarUrl');
  }

  static async unpublishBlog(blogId, userId) {
    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    if (blog.author.toString() !== userId) {
      throw new AppError('Not authorized to unpublish this blog', 403);
    }

    if (!blog.isPublished) {
      throw new AppError('Blog is not published', 400);
    }

    blog.isPublished = false;
    blog.publishedAt = null;
    await blog.save();

    return blog.populate('author', 'fullName publicUsername avatarUrl');
  }

  static async listPublishedBlogs(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = { isPublished: true };

    if (query.tags) {
      filter.tags = { $in: Array.isArray(query.tags) ? query.tags : [query.tags] };
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const blogs = await Blog.find(filter)
      .populate('author', 'fullName publicUsername avatarUrl')
      .skip(skip)
      .limit(limit)
      .sort({ publishedAt: -1 })
      .lean();

    const total = await Blog.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return { blogs, total, pages, currentPage: page };
  }

  static async getBlogBySlug(slug) {
    const blog = await Blog.findOne({ slug, isPublished: true }).populate('author', 'fullName publicUsername avatarUrl');

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    return blog;
  }

  static async getBlogById(blogId, userId = null) {
    const blog = await Blog.findById(blogId).populate('author', 'fullName publicUsername avatarUrl');

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    if (!blog.isPublished && (!userId || blog.author._id.toString() !== userId)) {
      throw new AppError('Not authorized to view this blog', 403);
    }

    return blog;
  }

  static async updateBlog(blogId, userId, data) {
    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    if (blog.author.toString() !== userId) {
      throw new AppError('Not authorized to update this blog', 403);
    }

    if (blog.isPublished) {
      throw new AppError('Cannot update published blog', 400);
    }

    const allowedFields = ['title', 'content', 'tags'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    });

    if (updates.title) {
      updates.slug = this.generateSlug(updates.title);
    }

    Object.assign(blog, updates);
    await blog.save();

    return blog.populate('author', 'fullName publicUsername avatarUrl');
  }

  static async deleteBlog(blogId, userId) {
    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    if (blog.author.toString() !== userId) {
      throw new AppError('Not authorized to delete this blog', 403);
    }

    await Blog.findByIdAndDelete(blogId);

    return { message: 'Blog deleted successfully' };
  }

  static async likeBlog(blogId) {
    const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { likes: 1 } }, { new: true });

    if (!blog) {
      throw new AppError('Blog not found', 404);
    }

    return blog;
  }

  static async getAuthorBlogs(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = { author: userId };

    const blogs = await Blog.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Blog.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return { blogs, total, pages, currentPage: page };
  }
}

export default BlogService;
