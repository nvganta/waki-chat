import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseAuth = {
  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('authToken', token);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('authToken', token);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  signOut: async () => {
    try {
      await auth().signOut();
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser: () => {
    return auth().currentUser;
  },

  onAuthStateChanged: (callback: (user: any) => void) => {
    return auth().onAuthStateChanged(callback);
  },

  refreshToken: async () => {
    const user = auth().currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      await AsyncStorage.setItem('authToken', token);
      return token;
    }
    return null;
  },
};

export const db = firestore();