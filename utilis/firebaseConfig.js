import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

// Replace these values with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "intikhab-mobile.firebaseapp.com",
  projectId: "intikhab-mobile",
  storageBucket: "intikhab-mobile.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Enable Firestore offline persistence
firestore().settings({ persistence: true });

// Request permission for push notifications
const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    // Get the FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  }
  
  console.log('Notification permission denied');
  return null;
};

// Create a new user document after authentication
const createUserDocument = async (user, username = null) => {
  if (!user) return;

  const userRef = firestore().collection('users').doc(user.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const { uid, email, displayName } = user;
    const createdAt = new Date();
    const actualUsername = username || displayName || email.split('@')[0];

    try {
      await userRef.set({
        id: uid,
        username: actualUsername,
        email,
        accountType: "curator",
        intikhab: {
          [`Intikhab-e-${actualUsername}`]: {
            items: [],
            isPublic: true,
            followers: []
          }
        },
        followedIntikhab: [],
        followedPoets: [],
        createdAt
      });
    } catch (error) {
      console.error("Error creating user document", error);
    }
  }

  return userRef;
};

// Sign in with email and password
const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Sign up with email and password
const signUpWithEmail = async (email, password, username) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    await createUserDocument(userCredential.user, username);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Sign out
const signOut = async () => {
  try {
    await auth().signOut();
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Get current user
const getCurrentUser = () => {
  return auth().currentUser;
};

export {
  app,
  auth,
  firestore,
  messaging,
  requestNotificationPermission,
  createUserDocument,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser
};