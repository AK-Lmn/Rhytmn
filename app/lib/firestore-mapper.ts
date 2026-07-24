import type { DocumentData, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import type { HealthLog } from "../types";

export function toFirestoreData(log: HealthLog): DocumentData {
  const { id, ...data } = log;
  void id;
  return data;
}

export function fromFirestoreData(id: string, data: DocumentData): HealthLog {
  return { id, ...data } as HealthLog;
}

export const healthLogConverter = {
  toFirestore: toFirestoreData,
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): HealthLog {
    return fromFirestoreData(snapshot.id, snapshot.data(options));
  },
};
