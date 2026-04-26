import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, where, limit, updateDoc, arrayUnion, arrayRemove, getDocFromServer } from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
  measurementId: firebaseConfigRaw.measurementId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfigRaw.firestoreDatabaseId);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  if (error?.code === 'permission-denied' || error?.message?.includes('insufficient permissions')) {
    const user = auth.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: error.message || 'Missing or insufficient permissions',
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'unauthenticated',
        email: user?.email || 'unknown',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || false,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw JSON.stringify(errorInfo);
  }
  throw error;
}

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export interface UserProfile {
  schoolName: string;
  hourGoal: number;
  grade?: string | null;
  state?: string | null;
  locationAllowed?: boolean | null;
  onboarded: boolean;
  displayName?: string;
  email?: string;
  bio?: string;
  following?: string[];
  followers?: string[];
}

export interface VolunteerActivity {
  id?: string;
  title: string;
  hours: number;
  date: string;
  description: string;
  createdAt: Timestamp;
}

export interface VolunteerBookmark {
  id: string; 
  title: string;
  organization: string;
  url: string;
  location: string;
  hours: string;
  tags: string[];
  savedAt: Timestamp;
}

export interface CommunityPost {
  id?: string;
  authorId: string;
  authorName: string;
  authorSchool?: string;
  title: string;
  content: string;
  imageUrl?: string;
  externalUrl?: string;
  type: 'announcement' | 'achievement' | 'idea' | 'event' | 'general';
  region: string;
  tags: string[];
  likes?: string[];
  reportedBy?: string[];
  commentCount?: number;
  createdAt: Timestamp;
}

export const getUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'get', `users/${uid}`);
  }
};

export const saveUserProfile = async (uid: string, profile: UserProfile) => {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, profile);
  } catch (error) {
    handleFirestoreError(error, 'write', `users/${uid}`);
  }
};

export const logVolunteerActivity = async (uid: string, activity: Omit<VolunteerActivity, 'id' | 'createdAt'>) => {
  try {
    const activitiesRef = collection(db, 'users', uid, 'activities');
    await addDoc(activitiesRef, {
      ...activity,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, 'create', `users/${uid}/activities`);
  }
};

export const getUserActivities = async (uid: string) => {
  try {
    const activitiesRef = collection(db, 'users', uid, 'activities');
    const q = query(activitiesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VolunteerActivity[];
  } catch (error) {
    handleFirestoreError(error, 'list', `users/${uid}/activities`);
  }
};

export const toggleBookmark = async (uid: string, opportunity: { id: string; title: string; organization: string; url: string; location: string; hours: string; tags: string[] }) => {
  try {
    const bookmarkRef = doc(db, 'users', uid, 'bookmarks', opportunity.id);
    const bookmarkSnap = await getDoc(bookmarkRef);

    if (bookmarkSnap.exists()) {
      await deleteDoc(bookmarkRef);
      return false; // Removed
    } else {
      await setDoc(bookmarkRef, {
        title: opportunity.title,
        organization: opportunity.organization,
        url: opportunity.url,
        location: opportunity.location,
        hours: opportunity.hours,
        tags: opportunity.tags,
        savedAt: Timestamp.now()
      });
      return true; // Added
    }
  } catch (error) {
    handleFirestoreError(error, 'write', `users/${uid}/bookmarks/${opportunity.id}`);
  }
};

export const getUserBookmarks = async (uid: string) => {
  try {
    const bookmarksRef = collection(db, 'users', uid, 'bookmarks');
    const q = query(bookmarksRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VolunteerBookmark[];
  } catch (error) {
    handleFirestoreError(error, 'list', `users/${uid}/bookmarks`);
  }
};

export const isBookmarked = async (uid: string, opportunityId: string) => {
  const bookmarkRef = doc(db, 'users', uid, 'bookmarks', opportunityId);
  const bookmarkSnap = await getDoc(bookmarkRef);
  return bookmarkSnap.exists();
};

export const createCommunityPost = async (post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'commentCount'>) => {
  try {
    const postsRef = collection(db, 'community_posts');
    await addDoc(postsRef, {
      ...post,
      likes: [],
      commentCount: 0,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, 'create', 'community_posts');
  }
};

export const toggleLikePost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const data = postSnap.data() as CommunityPost;
      const likes = data.likes || [];
      const isLiked = likes.includes(userId);
      
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
      return !isLiked;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, 'update', `community_posts/${postId}`);
  }
};

export const reportPost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      reportedBy: arrayUnion(userId)
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, 'update', `community_posts/${postId}`);
  }
};

export const toggleFollowUser = async (currentUserId: string, targetUserId: string) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    const currentUserSnap = await getDoc(currentUserRef);
    if (!currentUserSnap.exists()) return false;
    
    const following = (currentUserSnap.data() as UserProfile).following || [];
    const isFollowing = following.includes(targetUserId);
    
    await Promise.all([
      updateDoc(currentUserRef, {
        following: isFollowing ? arrayRemove(targetUserId) : arrayUnion(targetUserId)
      }),
      updateDoc(targetUserRef, {
        followers: isFollowing ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
      })
    ]);
    
    return !isFollowing;
  } catch (error) {
    handleFirestoreError(error, 'update', 'social_follow');
  }
};

export const getRegionalPosts = async (region: string) => {
  try {
    const postsRef = collection(db, 'community_posts');
    const q = query(
      postsRef, 
      where('region', '==', region),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommunityPost[];
  } catch (error) {
    handleFirestoreError(error, 'list', 'community_posts');
  }
};
