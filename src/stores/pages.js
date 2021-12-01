import { writable, get } from "svelte/store";

export const pageIndex = writable(0);
export const pageTitle = writable("Students");
