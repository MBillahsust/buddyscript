import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middlewares/auth';
import { LikeService } from '@services/likeService';
import { LikeTarget, likeTargetSchema } from '@validators/like';
import { successResponse } from '@utils/response';
import { AppError } from '@utils/errors';

const resolveTarget = (req: AuthRequest): { target: LikeTarget; targetId: string } | null => {
  const candidates: Array<[unknown, LikeTarget]> = [
    [req.params['postId'],    'post'],
    [req.params['commentId'], 'comment'],
    [req.params['replyId'],   'reply'],
  ];
  for (const [id, label] of candidates) {
    if (id) {
      const parsed = likeTargetSchema.safeParse(label);
      if (parsed.success) return { target: parsed.data, targetId: String(id) };
    }
  }
  return null;
};

/** POST …/:postId/like | …/:commentId/like | …/:replyId/like */
const toggle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId   = String(req.user!._id);
    const resolved = resolveTarget(req);
    if (!resolved) return next(AppError.badRequest('Unknown like target'));
    const result = await LikeService.toggle(userId, resolved.target, resolved.targetId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/** GET …/:postId/likes | …/:commentId/likes | …/:replyId/likes */
const getLikers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resolved = resolveTarget(req);
    if (!resolved) return next(AppError.badRequest('Unknown like target'));
    const cursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : undefined;
    const limit  = typeof req.query['limit']  === 'string' ? Math.min(parseInt(req.query['limit'], 10) || 20, 100) : 20;
    const result = await LikeService.getLikers(resolved.target, resolved.targetId, cursor, limit);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const LikeController = { toggle, getLikers };
