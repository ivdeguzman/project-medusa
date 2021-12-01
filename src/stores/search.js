import { writable, derived, get } from "svelte/store";
import { pageIndex } from "./pages";
const axios = require("axios").default;

export const searchValue = writable("");
export const searchIndex = writable(0);
export const searchResults = derived([searchValue, searchIndex], async () => {
	let url;
	if (get(pageIndex) == 0) url = "http://localhost:14500/api/student";
	else url = "http://localhost:14500/api/employee";

	try {
		let data = await axios.post(`${url}/get/search/`, {
			Search: get(searchValue),
			Index: get(searchIndex),
		});
		return data.data;
	} catch {
		return {
			message: "There is a problem with the database, please try again later.",
		};
	}
});
