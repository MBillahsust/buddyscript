/**
 * Master API Router — mounted at /api/v1
 */
import { Router, Request, Response } from 'express';
import { authRouter }    from './auth';
import { postRouter }    from './posts';
import { commentRouter } from './comments';
import { replyRouter }   from './replies';
import { uploadRouter }  from './upload';

const router = Router();

router.use('/auth',     authRouter);
router.use('/posts',    postRouter);
router.use('/comments', commentRouter);
router.use('/replies',  replyRouter);
router.use('/upload',   uploadRouter);

// 404 fallback — must be last
router.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code:    'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

export default router;
