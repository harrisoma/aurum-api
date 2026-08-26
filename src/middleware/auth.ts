import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';
import * as jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    // First try to verify token with admin client
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      // If admin client fails, try to decode JWT directly
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.sub && decoded?.email) {
          req.user = {
            id: decoded.sub,
            email: decoded.email,
          };
          return next();
        }
      } catch (decodeError) {
        // Decoding also failed
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    // Try to authenticate, but don't fail if it doesn't work
    supabaseAdmin.auth.getUser(token).then(({ data }: { data: any }) => {
      if (data.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email || '',
        };
      }
      next();
    });
  } else {
    next();
  }
}
