import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middlewares/auth';
import { ReplyService } from '@services/replyService';
import { successResponse } from '@utils/response';
import { CreateReplyInput } from '@validators/reply';

/** GET /api/v1/comments/:commentId/replies?cursor=&limit= */
const getReplies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const commentId = String(req.params['commentId'] ?? '');
    const userId    = String(req.user!._id);
    const cursor    = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : undefined;
    const limit     = typeof req.query['limit']  === 'string' ? Math.min(parseInt(req.query['limit'], 10) || 20, 100) : 20;
    const result = await ReplyService.getReplies(commentId, userId, cursor, limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/comments/:commentId/replies */
const createReply = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const commentId = String(req.params['commentId'] ?? '');
    const authorId  = String(req.user!._id);
    const { content } = req.body as CreateReplyInput;
    const reply = await ReplyService.createReply(commentId, authorId, content);
    successResponse(res, { reply }, 'Reply added', 201);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/v1/replies/:replyId */
const deleteReply = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const replyId = String(req.params['replyId'] ?? '');
    const userId  = String(req.user!._id);
    await ReplyService.deleteReply(replyId, userId);
    successResponse(res, null, 'Reply deleted');
  } catch (error) {
    next(error);
  }
};

export const ReplyController = { getReplies, createReply, deleteReply };
