/**
 * Post Routes
 *
 * GET    /posts                     — cursor-paginated feed
 * POST   /posts                     — create post (Zod validated)
 * DELETE /posts/:postId             — delete own post
 * POST   /posts/:postId/like        — toggle like
 * GET    /posts/:postId/likes       — who liked
 * GET    /posts/:postId/comments    — paginated comments
 * POST   /posts/:postId/comments    — create comment (Zod validated)
 */
import { Router } from 'express';
import { protect } from '@middlewares/auth';
import { validate } from '@middlewares/validate';
import { PostController } from '@controllers/postController';
import { LikeController } from '@controllers/likeController';
import { CommentController } from '@controllers/commentController';
import { createPostSchema } from '@validators/post';
import { createCommentSchema } from '@validators/comment';

export const postRouter = Router();

postRouter.use(protect());

postRouter.get('/', PostController.getFeed);
postRouter.post('/', validate(createPostSchema), PostController.createPost);
postRouter.delete('/:postId', PostController.deletePost);

postRouter.post('/:postId/like', LikeController.toggle);
postRouter.get('/:postId/likes', LikeController.getLikers);

postRouter.get('/:postId/comments', CommentController.getComments);
postRouter.post('/:postId/comments', validate(createCommentSchema), CommentController.createComment);
