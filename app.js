"use strict";

const { app, BrowserWindow, ipcMain } = require("electron");

async function createWindow() {
	// Create the browser window.
	const win = new BrowserWindow({
		minWidth: 800,
		minHeight: 600,
		width: 1366,
		height: 768,
		// frame: false,
		titleBarStyle: "hidden",
		backgroundColor: "#EFEFEF",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			devTools: true,
		},
	});

	win.loadFile("./src/index.html");

	ipcMain.on("shutdown-prompt", () => {
		app.quit();
	});

	ipcMain.on("minimize-window", () => {
		win.minimize();
	});

	ipcMain.on("maximize-window", () => {
		if (win.isMaximized()) {
			win.restore();
		} else win.maximize();
	});
}

app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", () => {
	createWindow();
});
