import { auth, firestore } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLogin: Date;
  preferences?: any;
}

export class AuthService {
  async verifyToken(token: string): Promise<DecodedIdToken> {
    try {
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new Error('Invalid authentication token');
    }
  }

  async createUser(email: string, password: string, displayName: string): Promise<string> {
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      // Store additional user data in Firestore
      await firestore.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      return userRecord.uid;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  }

  async getUserById(uid: string): Promise<User | null> {
    try {
      const doc = await firestore.collection('users').doc(uid).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  async updateLastLogin(uid: string): Promise<void> {
    try {
      await firestore.collection('users').doc(uid).update({
        lastLogin: new Date(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await auth.deleteUser(uid);
      await firestore.collection('users').doc(uid).delete();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      await firestore.collection('users').doc(uid).update(updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }
}

export const authService = new AuthService();