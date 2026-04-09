/**
 * Reply Routes  (standalone — for actions on an existing reply)
 *
 * DELETE /replies/:replyId        — delete own reply
 * POST   /replies/:replyId/like   — toggle like on reply
 * GET    /replies/:replyId/likes  — who liked reply
 */
import { Router } from 'express';
import { protect } from '@middlewares/auth';
import { ReplyController } from '@controllers/replyController';
import { LikeController } from '@controllers/likeController';

export const replyRouter = Router();

replyRouter.use(protect());

replyRouter.delete('/:replyId',        ReplyController.deleteReply);
replyRouter.post('/:replyId/like',     LikeController.toggle);
replyRouter.get('/:replyId/likes',     LikeController.getLikers);
