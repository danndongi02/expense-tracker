import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  CollectionReference,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

export function getUserCollection(userId: string, collectionName: string): CollectionReference {
  return collection(db, "users", userId, collectionName);
}

export function getUserDoc(userId: string, collectionName: string, docId: string) {
  return doc(db, "users", userId, collectionName, docId);
}

export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  onSnapshot,
  writeBatch,
  db,
};
export type { DocumentData, QueryConstraint, QuerySnapshot };
