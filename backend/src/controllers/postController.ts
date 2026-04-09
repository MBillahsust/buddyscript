import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middlewares/auth';
import { PostService } from '@services/postService';
import { successResponse } from '@utils/response';
import { CreatePostInput } from '@validators/post';

/** GET /api/v1/posts?cursor=&limit= */
const getFeed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = String(req.user!._id);
    const cursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : undefined;
    const limit  = typeof req.query['limit']  === 'string' ? Math.min(parseInt(req.query['limit'], 10) || 10, 50) : 10;
    const result = await PostService.getFeed(userId, cursor, limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/posts */
const createPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorId = String(req.user!._id);
    const post = await PostService.createPost(authorId, req.body as CreatePostInput);
    successResponse(res, { post }, 'Post created', 201);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/v1/posts/:postId */
const deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = String(req.user!._id);
    const postId = String(req.params['postId'] ?? '');
    await PostService.deletePost(postId, userId);
    successResponse(res, null, 'Post deleted');
  } catch (error) {
    next(error);
  }
};

export const PostController = { getFeed, createPost, deletePost };
