"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  hydrateAuthenticatedAccount,
  type AuthenticatedIdentity,
  type StoredAccount,
} from "./account-hydration";
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

const pendingProfileWrites = new Map<string, Promise<void>>();

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
  const store = db;
  const safeProfile = {
    uid,
    ...(profile.email ? { email: profile.email } : {}),
    preferredName: preferences.preferredName,
    createdAt: profile.createdAt,
    demo: false,
  };
  const previous = pendingProfileWrites.get(uid) ?? Promise.resolve();
  const current = previous
    .catch(() => undefined)
    .then(async () => {
      await Promise.all([
        setDoc(doc(store, "users", uid), safeProfile, { merge: true }),
        setDoc(doc(store, "users", uid, "settings", "preferences"), preferences, { merge: true }),
      ]);
    });
  pendingProfileWrites.set(uid, current);
  try {
    await current;
  } finally {
    if (pendingProfileWrites.get(uid) === current) pendingProfileWrites.delete(uid);
  }
}

export async function loadAuthenticatedAccount(identity: AuthenticatedIdentity) {
  const store = db;
  if (!store) throw new Error("Firebase is not configured.");

  return hydrateAuthenticatedAccount(identity, {
    async load(uid) {
      const [profileSnapshot, preferencesSnapshot] = await Promise.all([
        getDoc(doc(store, "users", uid)),
        getDoc(doc(store, "users", uid, "settings", "preferences")),
      ]);
      if (!profileSnapshot.exists()) return null;
      return {
        profile: profileSnapshot.data(),
        preferences: preferencesSnapshot.exists() ? preferencesSnapshot.data() : undefined,
      } as StoredAccount;
    },
    async createIfAbsent(uid, defaults) {
      return runTransaction(store, async (transaction) => {
        const profileReference = doc(store, "users", uid);
        const preferencesReference = doc(store, "users", uid, "settings", "preferences");
        const [profileSnapshot, preferencesSnapshot] = await Promise.all([
          transaction.get(profileReference),
          transaction.get(preferencesReference),
        ]);

        if (profileSnapshot.exists()) {
          return {
            account: {
              profile: profileSnapshot.data(),
              preferences: preferencesSnapshot.exists() ? preferencesSnapshot.data() : undefined,
            } as StoredAccount,
            created: false,
          };
        }

        transaction.set(profileReference, defaults.profile);
        if (defaults.preferences) transaction.set(preferencesReference, defaults.preferences);
        return { account: defaults, created: true };
      });
    },
  });
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
