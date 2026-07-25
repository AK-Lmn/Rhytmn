import { createAccountPreferences } from "./constants";
import type { Preferences, UserProfile } from "../types";

export interface AuthenticatedIdentity {
  uid: string;
  email?: string;
  displayName?: string;
  createdAt?: string;
}

export interface StoredAccount {
  profile: Partial<UserProfile>;
  preferences?: Partial<Preferences>;
}

export interface AccountRepository {
  load: (uid: string) => Promise<StoredAccount | null>;
  createIfAbsent: (
    uid: string,
    defaults: StoredAccount,
  ) => Promise<{ account: StoredAccount; created: boolean }>;
}

export interface HydratedAccount {
  profile: UserProfile;
  preferences: Preferences;
  isNew: boolean;
}

function firstName(value?: string) {
  return value?.trim().split(/\s+/)[0];
}

function identityName(identity: AuthenticatedIdentity) {
  return (
    firstName(identity.displayName) ||
    identity.email?.split("@")[0]?.trim() ||
    "You"
  );
}

export function createNewAccount(identity: AuthenticatedIdentity): StoredAccount {
  const preferredName = identityName(identity);
  return {
    profile: {
      uid: identity.uid,
      ...(identity.email ? { email: identity.email } : {}),
      preferredName,
      createdAt: identity.createdAt ?? new Date().toISOString(),
      demo: false,
    },
    preferences: createAccountPreferences(preferredName),
  };
}

export function resolveAuthenticatedAccount(
  identity: AuthenticatedIdentity,
  stored: StoredAccount,
  isNew = false,
): HydratedAccount {
  const preferredName =
    (typeof stored.profile.preferredName === "string" &&
      stored.profile.preferredName.trim()) ||
    identityName(identity);
  const profile: UserProfile = {
    uid: identity.uid,
    ...((typeof stored.profile.email === "string" && stored.profile.email) ||
    identity.email
      ? {
          email:
            (typeof stored.profile.email === "string" && stored.profile.email) ||
            identity.email,
        }
      : {}),
    preferredName,
    createdAt:
      (typeof stored.profile.createdAt === "string" &&
        stored.profile.createdAt) ||
      identity.createdAt ||
      new Date().toISOString(),
    demo: false,
  };

  return {
    profile,
    preferences: {
      ...createAccountPreferences(preferredName),
      ...stored.preferences,
      preferredName,
    },
    isNew,
  };
}

export async function hydrateAuthenticatedAccount(
  identity: AuthenticatedIdentity,
  repository: AccountRepository,
): Promise<HydratedAccount> {
  const existing = await repository.load(identity.uid);
  if (existing) return resolveAuthenticatedAccount(identity, existing);

  const result = await repository.createIfAbsent(
    identity.uid,
    createNewAccount(identity),
  );
  return resolveAuthenticatedAccount(identity, result.account, result.created);
}
