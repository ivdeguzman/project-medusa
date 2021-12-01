import { derived, writable, get } from "svelte/store";
import { pageIndex } from "./pages";
const axios = require("axios").default;

export const newProfile = writable("");
export const editProfile = writable("");
export const selectedProfile = writable("");
export const selectedProfileCurrentIndex = writable(0);
export const selectedProfileIndices = derived(
	[selectedProfile, selectedProfileCurrentIndex],
	async () => {
		let url;
		if (get(pageIndex) == 0)
			url = `http://localhost:14500/api/student/attendance/get/${
				get(selectedProfile)._id
			}/count`;
		else
			url = `http://localhost:14500/api/employee/attendance/get/${
				get(selectedProfile)._id
			}/count`;
		try {
			let data = await axios.get(url);
			return data.data;
		} catch {
			return {
				message:
					"There is a problem with the database, please try again later.",
			};
		}
	}
);
export const selectedProfileData = derived(
	[selectedProfileIndices, selectedProfileCurrentIndex],
	async () => {
		let url;
		if (get(pageIndex) == 0)
			url = `http://localhost:14500/api/student/attendance/get/${
				get(selectedProfile)._id
			}/list/${get(selectedProfileCurrentIndex)}`;
		else
			url = `http://localhost:14500/api/employee/attendance/get/${
				get(selectedProfile)._id
			}/list/${get(selectedProfileCurrentIndex)}`;

		try {
			let data = await axios.get(url);
			return data.data;
		} catch {
			return {
				message:
					"There is a problem with the database, please try again later.",
			};
		}
	}
);
