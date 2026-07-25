import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  createNewAccount,
  hydrateAuthenticatedAccount,
  type AccountRepository,
  type StoredAccount,
} from "../app/lib/account-hydration";
import {
  sanitizePersistedSession,
  selectDisplayName,
} from "../app/store/app-store";

const kim: StoredAccount = {
  profile: {
    uid: "kim-uid",
    email: "kim@example.com",
    preferredName: "Kim",
    createdAt: "2024-01-01T00:00:00.000Z",
    demo: false,
  },
  preferences: {
    preferredName: "Alex",
    waterGoalMl: 2800,
    theme: "dark",
  },
};

function repositoryWith(record: StoredAccount | null): AccountRepository {
  return {
    load: vi.fn().mockResolvedValue(record),
    createIfAbsent: vi
      .fn()
      .mockImplementation(async (_uid, defaults) => ({ account: defaults, created: true })),
  };
}

describe("authenticated account hydration", () => {
  it("keeps an existing Kim profile through logout and sign-in", async () => {
    const repository = repositoryWith(kim);
    const identity = {
      uid: "kim-uid",
      email: "kim@example.com",
      displayName: "Kim Rivera",
    };

    const firstSignIn = await hydrateAuthenticatedAccount(identity, repository);
    const secondSignIn = await hydrateAuthenticatedAccount(identity, repository);

    expect(firstSignIn.profile.preferredName).toBe("Kim");
    expect(secondSignIn.profile.preferredName).toBe("Kim");
    expect(secondSignIn.preferences.preferredName).toBe("Kim");
    expect(secondSignIn.preferences.waterGoalMl).toBe(2800);
    expect(secondSignIn.preferences.theme).toBe("dark");
    expect(repository.createIfAbsent).not.toHaveBeenCalled();
  });

  it("uses one authoritative name for dashboard and Settings", async () => {
    const account = await hydrateAuthenticatedAccount(
      { uid: "kim-uid", email: "kim@example.com" },
      repositoryWith(kim),
    );
    const state = {
      mode: "firebase" as const,
      profile: account.profile,
      preferences: account.preferences,
    };

    expect(selectDisplayName(state)).toBe("Kim");
    const [dashboard, settings] = await Promise.all([
      readFile("app/screens/dashboard.tsx", "utf8"),
      readFile("app/screens/settings.tsx", "utf8"),
    ]);
    expect(dashboard).toContain("useAppStore(selectDisplayName)");
    expect(settings).toContain("useAppStore(selectDisplayName)");
  });

  it("never carries persisted demo Alex data into an authenticated session", () => {
    expect(
      sanitizePersistedSession({
        mode: "firebase",
        profile: { uid: "kim-uid", preferredName: "Alex", demo: false },
        preferences: { preferredName: "Alex" },
      }),
    ).toEqual({});
    expect(
      createNewAccount({ uid: "new-uid", email: "kim@example.com" }).profile
        .preferredName,
    ).toBe("kim");
  });

  it("creates defaults only for a genuinely new account", async () => {
    const repository = repositoryWith(null);
    const account = await hydrateAuthenticatedAccount(
      { uid: "new-uid", displayName: "Priya Shah", email: "priya@example.com" },
      repository,
    );

    expect(repository.createIfAbsent).toHaveBeenCalledOnce();
    expect(account.profile.preferredName).toBe("Priya");
    expect(account.preferences.preferredName).toBe("Priya");
    expect(account.isNew).toBe(true);
  });

  it("cannot write fallback defaults while profile loading is pending", async () => {
    let resolveLoad!: (value: StoredAccount) => void;
    const load = vi.fn(
      () =>
        new Promise<StoredAccount>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const createIfAbsent = vi.fn();
    const pending = hydrateAuthenticatedAccount(
      { uid: "kim-uid", email: "kim@example.com" },
      { load, createIfAbsent },
    );

    await Promise.resolve();
    expect(createIfAbsent).not.toHaveBeenCalled();
    resolveLoad(kim);
    await expect(pending).resolves.toMatchObject({
      profile: { preferredName: "Kim" },
    });
    expect(createIfAbsent).not.toHaveBeenCalled();
  });
});
