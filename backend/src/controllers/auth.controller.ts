import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, displayName } = req.body;

      if (!email || !password || !displayName) {
        return res.status(400).json({ 
          error: 'Email, password, and display name are required' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters' 
        });
      }

      const uid = await authService.createUser(email, password, displayName);

      res.status(201).json({
        message: 'User created successfully',
        uid,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to register user' 
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await authService.getUserById(req.user.uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { displayName, preferences } = req.body;
      const updates: any = {};

      if (displayName) updates.displayName = displayName;
      if (preferences) updates.preferences = preferences;

      await authService.updateUserProfile(req.user.uid, updates);

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async deleteAccount(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await authService.deleteUser(req.user.uid);

      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }

  async verifyToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const decodedToken = await authService.verifyToken(token);

      res.json({
        valid: true,
        uid: decodedToken.uid,
        email: decodedToken.email,
      });
    } catch (error) {
      res.status(401).json({
        valid: false,
        error: 'Invalid or expired token',
      });
    }
  }
}

export const authController = new AuthController();