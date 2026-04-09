/**
 * Comment Routes  (standalone — for actions on an existing comment)
 *
 * DELETE /comments/:commentId            — delete own comment (cascades replies)
 * POST   /comments/:commentId/like       — toggle like on comment
 * GET    /comments/:commentId/likes      — who liked comment
 * GET    /comments/:commentId/replies    — paginated replies
 * POST   /comments/:commentId/replies    — create reply (Zod validated)
 */
import { Router } from 'express';
import { protect } from '@middlewares/auth';
import { validate } from '@middlewares/validate';
import { CommentController } from '@controllers/commentController';
import { LikeController } from '@controllers/likeController';
import { ReplyController } from '@controllers/replyController';
import { createReplySchema } from '@validators/reply';

export const commentRouter = Router();

commentRouter.use(protect());

commentRouter.delete('/:commentId', CommentController.deleteComment);

commentRouter.post('/:commentId/like', LikeController.toggle);
commentRouter.get('/:commentId/likes', LikeController.getLikers);

commentRouter.get('/:commentId/replies', ReplyController.getReplies);
commentRouter.post('/:commentId/replies', validate(createReplySchema), ReplyController.createReply);
