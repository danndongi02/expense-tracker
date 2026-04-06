import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { seedDefaultCategories } from "@/lib/services/categories.service";
import { initializeTransactionCounter } from "@/lib/services/transactions.service";

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    displayName,
    currency: "KES",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await seedDefaultCategories(user.uid);
  await initializeTransactionCounter(user.uid);

  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
