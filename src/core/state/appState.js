import { AppState } from './state.js';
import { readControlPreferences, persistControlPreferences } from './controlPersistence.js';

let storage;
try { storage = globalThis.localStorage; } catch { /* Private storage can be blocked. */ }
export const appState = new AppState(readControlPreferences(storage));
persistControlPreferences(appState, storage);
