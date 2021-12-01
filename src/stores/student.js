import { writable, derived, get } from "svelte/store";
import { pageIndex } from "./pages";
import { selectedProfile } from "./profile";
import { addToggleComplete } from "./ui";
const axios = require("axios").default;

let axiosGet = async (url) => {
	try {
		const data = await axios.get(url);
		return data.data;
	} catch {
		return {
			message: "There is a problem with the database, please try again later.",
		};
	}
};

export const studentCurrentIndex = writable(1);
export const studentData = derived(
	[studentCurrentIndex, pageIndex, selectedProfile, addToggleComplete],
	async () => {
		let data = await axiosGet(
			`http://localhost:14500/api/student/get/${get(studentCurrentIndex)}`
		);
		return data;
	}
);
export const studentTotalIndexCount = derived(
	[studentCurrentIndex, pageIndex, selectedProfile, addToggleComplete],
	async () => {
		let data = await axiosGet(`http://localhost:14500/api/student/get`);
		return data;
	}
);
