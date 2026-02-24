import BlogService from '../services/blogService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const createBlog = catchAsync(async (req, res) => {
  const { title, content, tags } = req.body;
  const userId = req.user.id;

  if (!req.user.role || !['instructor', 'admin'].includes(req.user.role)) {
    throw new AppError('Only instructors and admins can create blogs', 403);
  }

  const blog = await BlogService.createBlog(userId, { title, content, tags });

  res.status(201).json({
    message: 'Blog created successfully',
    data: blog,
  });
});

export const updateBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, content, tags } = req.body;

  const blog = await BlogService.updateBlog(id, userId, { title, content, tags });

  res.json({
    message: 'Blog updated successfully',
    data: blog,
  });
});

export const publishBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const blog = await BlogService.publishBlog(id, userId);

  res.json({
    message: 'Blog published successfully',
    data: blog,
  });
});

export const unpublishBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const blog = await BlogService.unpublishBlog(id, userId);

  res.json({
    message: 'Blog unpublished successfully',
    data: blog,
  });
});

export const listBlogs = catchAsync(async (req, res) => {
  const { page, limit, tags, search } = req.query;

  const result = await BlogService.listPublishedBlogs({ page, limit, tags, search });

  res.json({
    message: 'Blogs retrieved successfully',
    data: result.blogs,
    pagination: {
      currentPage: result.currentPage,
      pages: result.pages,
      total: result.total,
    },
  });
});

export const getBlogBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const blog = await BlogService.getBlogBySlug(slug);

  res.json({
    message: 'Blog retrieved successfully',
    data: blog,
  });
});

export const getBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const blog = await BlogService.getBlogById(id, userId);

  res.json({
    message: 'Blog retrieved successfully',
    data: blog,
  });
});

export const likeBlog = catchAsync(async (req, res) => {
  const { id } = req.params;

  const blog = await BlogService.likeBlog(id);

  res.json({
    message: 'Blog liked successfully',
    data: blog,
  });
});

export const deleteBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await BlogService.deleteBlog(id, userId);

  res.json({
    message: 'Blog deleted successfully',
  });
});

export const getAuthorBlogs = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page, limit } = req.query;

  const result = await BlogService.getAuthorBlogs(userId, { page, limit });

  res.json({
    message: 'Author blogs retrieved successfully',
    data: result.blogs,
    pagination: {
      currentPage: result.currentPage,
      pages: result.pages,
      total: result.total,
    },
  });
});
