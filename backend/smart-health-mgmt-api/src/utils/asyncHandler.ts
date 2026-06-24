import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response | void>;

const asyncHandler = (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Only call next if response hasn't been sent yet
      if (!res.headersSent) {
        next(err);
      } else {
        console.error('Error after headers sent:', err);
      }
    });
  };

export default asyncHandler;