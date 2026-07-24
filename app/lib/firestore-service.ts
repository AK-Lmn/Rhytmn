"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { fromFirestoreData, toFirestoreData } from "./firestore-mapper";
import type { HealthLog, Preferences, UserProfile } from "../types";

const collectionFor = (kind: HealthLog["kind"]) =>
  kind === "poop"
    ? "poopLogs"
    : kind === "pee"
      ? "peeLogs"
      : kind === "water"
        ? "waterLogs"
        : "checkIns";

export function subscribeToUserLogs(uid: string, onChange: (logs: HealthLog[]) => void, onError: (error: Error) => void) {
  const store = db;
  if (!store) return () => undefined;
  const buckets = ["poopLogs", "peeLogs", "waterLogs", "checkIns"];
  const data = new Map<string, HealthLog[]>();
  const unsubscribers = buckets.map((bucket) =>
    onSnapshot(
      collection(store, "users", uid, bucket),
      (snapshot) => {
        data.set(
          bucket,
          snapshot.docs.map((item) => fromFirestoreData(item.id, item.data())),
        );
        if (data.size === buckets.length) onChange([...data.values()].flat());
      },
      (error) => onError(error),
    ),
  );
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function saveRemoteLog(uid: string, log: HealthLog) {
  if (!db) return;
  await setDoc(doc(db, "users", uid, collectionFor(log.kind), log.id), toFirestoreData(log));
}

export async function deleteRemoteLog(uid: string, log: HealthLog) {
  if (!db) return;
  await deleteDoc(doc(db, "users", uid, collectionFor(log.kind), log.id));
}

export async function saveProfile(uid: string, profile: UserProfile, preferences: Preferences) {
  if (!db) return;
  await Promise.all([
    setDoc(doc(db, "users", uid), profile, { merge: true }),
    setDoc(doc(db, "users", uid, "settings", "preferences"), preferences, { merge: true }),
  ]);
}

export async function deleteAllRemoteData(uid: string) {
  if (!db) return;
  for (const bucket of ["poopLogs", "peeLogs", "waterLogs", "checkIns"]) {
    const snapshot = await getDocs(collection(db, "users", uid, bucket));
    const batch = writeBatch(db);
    snapshot.docs.forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "users", uid, "settings", "preferences"));
  await deleteDoc(doc(db, "users", uid));
}
