import BlogService from '../services/blogService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

export const createBlog = catchAsync(async (req, res) => {
  const userRoles = req.user.roles || [];
  if (!userRoles.includes('instructor') && !userRoles.includes('admin')) {
    throw new AppError('Only instructors and admins can create blogs', 403);
  }
  const blog = await BlogService.createBlog(req.user.id, { title: req.body.title, content: req.body.content, tags: req.body.tags });
  res.status(201).json({ message: 'Blog created successfully', data: blog });
});

export const updateBlog = catchAsync(async (req, res) => {
  const blog = await BlogService.updateBlog(req.params.id, req.user.id, { title: req.body.title, content: req.body.content, tags: req.body.tags });
  res.json({ message: 'Blog updated successfully', data: blog });
});

export const publishBlog = catchAsync(async (req, res) => {
  const blog = await BlogService.publishBlog(req.params.id, req.user.id);
  res.json({ message: 'Blog published successfully', data: blog });
});

export const unpublishBlog = catchAsync(async (req, res) => {
  const blog = await BlogService.unpublishBlog(req.params.id, req.user.id);
  res.json({ message: 'Blog unpublished successfully', data: blog });
});

export const listBlogs = catchAsync(async (req, res) => {
  const result = await BlogService.listPublishedBlogs({ page: req.query.page, limit: req.query.limit, tags: req.query.tags, search: req.query.search });
  res.json({
    message: 'Blogs retrieved successfully',
    data: result.blogs,
    pagination: { currentPage: result.currentPage, pages: result.pages, total: result.total },
  });
});

export const getBlogBySlug = catchAsync(async (req, res) => {
  const blog = await BlogService.getBlogBySlug(req.params.slug);
  res.json({ message: 'Blog retrieved successfully', data: blog });
});

export const getBlog = catchAsync(async (req, res) => {
  const blog = await BlogService.getBlogById(req.params.id, req.user?.id);
  res.json({ message: 'Blog retrieved successfully', data: blog });
});

export const likeBlog = catchAsync(async (req, res) => {
  const blog = await BlogService.likeBlog(req.params.id);
  res.json({ message: 'Blog liked successfully', data: blog });
});

export const deleteBlog = catchAsync(async (req, res) => {
  await BlogService.deleteBlog(req.params.id, req.user.id);
  res.json({ message: 'Blog deleted successfully' });
});

export const getAuthorBlogs = catchAsync(async (req, res) => {
  const result = await BlogService.getAuthorBlogs(req.user.id, { page: req.query.page, limit: req.query.limit });
  res.json({
    message: 'Author blogs retrieved successfully',
    data: result.blogs,
    pagination: { currentPage: result.currentPage, pages: result.pages, total: result.total },
  });
});
