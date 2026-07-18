import "server-only";

import type { NativeOkfAccessConfig } from "./config.ts";
import { SqliteNativeOkfOperationalStore } from "./sqlite-store.ts";
import type { NativeOkfOperationalStore } from "./store.ts";

const OPERATIONAL_STORE_SINGLETON = Symbol.for(
  "native-okf.operational-store.singleton",
);

interface OperationalStoreSingleton {
  databasePath: string;
  store: NativeOkfOperationalStore;
}

function getProcessGlobals(): Record<PropertyKey, unknown> {
  return globalThis as unknown as Record<PropertyKey, unknown>;
}

function getSingleton(): OperationalStoreSingleton | undefined {
  return getProcessGlobals()[OPERATIONAL_STORE_SINGLETON] as
    | OperationalStoreSingleton
    | undefined;
}

function setSingleton(singleton: OperationalStoreSingleton): void {
  getProcessGlobals()[OPERATIONAL_STORE_SINGLETON] = singleton;
}

export function initializeNativeOkfOperationalStore(
  store: NativeOkfOperationalStore,
  nowMs: number,
): NativeOkfOperationalStore {
  store.initialize();
  // An interrupted process may leave paid reservations active. Settle them
  // conservatively before accepting another paid request.
  store.cleanupStaleReservations(nowMs);
  return store;
}

/** Runtime code always receives the durable adapter; memory is test-only. */
export function getNativeOkfOperationalStore(
  config: Pick<NativeOkfAccessConfig, "usageDbPath">,
): NativeOkfOperationalStore {
  const singleton = getSingleton();
  if (singleton) {
    if (singleton.databasePath !== config.usageDbPath) {
      throw new Error(
        "The native OKF operational store was already initialized with another path.",
      );
    }
    return singleton.store;
  }
  const store = new SqliteNativeOkfOperationalStore(config.usageDbPath);
  setSingleton({
    databasePath: config.usageDbPath,
    store: initializeNativeOkfOperationalStore(store, Date.now()),
  });
  return store;
}

export function clearNativeOkfOperationalStoreForTests(): void {
  const singleton = getSingleton();
  singleton?.store.close();
  delete getProcessGlobals()[OPERATIONAL_STORE_SINGLETON];
}

