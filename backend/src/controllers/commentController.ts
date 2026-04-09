import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middlewares/auth';
import { CommentService } from '@services/commentService';
import { successResponse } from '@utils/response';
import { CreateCommentInput } from '@validators/comment';

/** GET /api/v1/posts/:postId/comments?cursor=&limit= */
const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = String(req.params['postId'] ?? '');
    const userId = String(req.user!._id);
    const cursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : undefined;
    const limit  = typeof req.query['limit']  === 'string' ? Math.min(parseInt(req.query['limit'], 10) || 20, 100) : 20;
    const result = await CommentService.getComments(postId, userId, cursor, limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/posts/:postId/comments */
const createComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId   = String(req.params['postId'] ?? '');
    const authorId = String(req.user!._id);
    const { content } = req.body as CreateCommentInput;
    const comment = await CommentService.createComment(postId, authorId, content);
    successResponse(res, { comment }, 'Comment added', 201);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/v1/comments/:commentId */
const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const commentId = String(req.params['commentId'] ?? '');
    const userId    = String(req.user!._id);
    await CommentService.deleteComment(commentId, userId);
    successResponse(res, null, 'Comment deleted');
  } catch (error) {
    next(error);
  }
};

export const CommentController = { getComments, createComment, deleteComment };
