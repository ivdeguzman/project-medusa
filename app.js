const { app, BrowserWindow, ipcMain } = require("electron");
const isDev = require("electron-is-dev");

// If in development use electron-reload to watch for
// changes in the current directory
if (isDev) {
	require("electron-reload")(__dirname, {
		electron: require(`${__dirname}/node_modules/electron`),
	});
}

async function createWindow() {
	// Create the browser window with node integration
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

	win.loadFile("./public/index.html");

	// Open the DevTools only if app is in development
	// If in production, don't show.
	if (isDev) win.webContents.openDevTools();

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
