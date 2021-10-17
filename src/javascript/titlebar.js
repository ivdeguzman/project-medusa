const { ipcRenderer } = require("electron");

shutdownPrompt.addEventListener("click", () => {
	ipcRenderer.send("shutdown-prompt");
});

minimizeWindow.addEventListener("click", () => {
	ipcRenderer.send("minimize-window");
});

maximizeWindow.addEventListener("click", () => {
	ipcRenderer.send("maximize-window");
});

studentsTab.addEventListener("click", () => {
	document.getElementById("instructorsTab").classList.remove("active");
	document.getElementById("studentsTab").classList.add("active");
});

instructorsTab.addEventListener("click", () => {
	document.getElementById("studentsTab").classList.remove("active");
	document.getElementById("instructorsTab").classList.add("active");
});
