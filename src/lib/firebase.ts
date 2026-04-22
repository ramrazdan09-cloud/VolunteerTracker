import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, where, limit, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
export const googleProvider = new GoogleAuthProvider();

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
  commentCount?: number;
  createdAt: Timestamp;
}

export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const saveUserProfile = async (uid: string, profile: UserProfile) => {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, profile);
};

export const logVolunteerActivity = async (uid: string, activity: Omit<VolunteerActivity, 'id' | 'createdAt'>) => {
  const activitiesRef = collection(db, 'users', uid, 'activities');
  await addDoc(activitiesRef, {
    ...activity,
    createdAt: Timestamp.now()
  });
};

export const getUserActivities = async (uid: string) => {
  const activitiesRef = collection(db, 'users', uid, 'activities');
  const q = query(activitiesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as VolunteerActivity[];
};

export const toggleBookmark = async (uid: string, opportunity: { id: string; title: string; organization: string; url: string; location: string; hours: string; tags: string[] }) => {
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
};

export const getUserBookmarks = async (uid: string) => {
  const bookmarksRef = collection(db, 'users', uid, 'bookmarks');
  const q = query(bookmarksRef, orderBy('savedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as VolunteerBookmark[];
};

export const isBookmarked = async (uid: string, opportunityId: string) => {
  const bookmarkRef = doc(db, 'users', uid, 'bookmarks', opportunityId);
  const bookmarkSnap = await getDoc(bookmarkRef);
  return bookmarkSnap.exists();
};

export const createCommunityPost = async (post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'commentCount'>) => {
  const postsRef = collection(db, 'community_posts');
  await addDoc(postsRef, {
    ...post,
    likes: [],
    commentCount: 0,
    createdAt: Timestamp.now()
  });
};

export const toggleLikePost = async (postId: string, userId: string) => {
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
};

export const toggleFollowUser = async (currentUserId: string, targetUserId: string) => {
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
};

export const getRegionalPosts = async (region: string) => {
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
};
