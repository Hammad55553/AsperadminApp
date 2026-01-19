import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase config keys
const firebaseConfig = {
    apiKey: "AIzaSyCET0VogO25D_irjcw8UrXuxzdNt4hRnlw",
    authDomain: "asperinfotech-2d299.firebaseapp.com",
    projectId: "asperinfotech-2d299",
    storageBucket: "asperinfotech-2d299.firebasestorage.app",
    messagingSenderId: "789263958500",
    appId: "1:789263958500:android:c1f158dcfa9412999a07f1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
