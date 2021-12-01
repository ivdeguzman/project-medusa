import { writable } from "svelte/store";

export const sidebar = writable(false);
export const addToggle = writable(false);
export const addToggleComplete = writable(false);
export const loadingComplete = writable(false);
export const destroyComponent = writable(false);
export const raspberryConnected = writable(false);

// State 0 - Welcome Screen
// State 1 - User Name Info
// State 2 - Occupation/Student Info
// State 3 - Image Selection Window
// State 4 - Post Status
// State 5 - Success
// State 6 - Failure
// State 10 - Edit Screen
export const subWindowStatus = writable(0);
