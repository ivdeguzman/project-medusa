const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const loadServer = require("./rest");

// const isDev = require("electron-is-dev");

// If in development use electron-reload to watch for
// changes in the current directory
// if (isDev) {
// 	require("electron-reload")(__dirname, {
// 		electron: require(`${__dirname}/node_modules/electron`),
// 	});
// }

function createWindow() {
	// Create the browser window with node integration
	const win = new BrowserWindow({
		minWidth: 512,
		minHeight: 540,
		width: 960,
		height: 540,
		titleBarStyle: "hidden",
		backgroundColor: "#EFEFEF",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			devTools: true,
		},
	});

	win.loadFile(`${__dirname}/public/index.html`);
	win.once("ready-to-show", () => {
		loadServer(win);
	});

	// Open the DevTools only if app is in development
	// If in production, don't show.
	// if (isDev) win.webContents.openDevTools();

	// Sends shutdown request from renderer
	ipcMain.on("shutdown-prompt", () => {
		app.quit();
	});

	// Sends minimize request from renderer
	ipcMain.on("minimize-window", () => {
		win.minimize();
	});

	// Sends maximize request from renderer
	ipcMain.on("maximize-window", () => {
		win.isMaximized() ? win.restore() : win.maximize();
	});

	// Sends an open dialogue box request from renderer
	ipcMain.on("select-image", (event) => {
		dialog
			.showOpenDialog(win, {
				properties: ["openFile"],
				filters: [
					{
						name: "Images",
						extensions: ["jpg", "jpeg", "png"],
					},
				],
			})
			.then((result) => {
				filePath = result.filePaths[0];
				filePath == undefined
					? (event.returnValue = "")
					: (event.returnValue = filePath);
			})
			.catch((e) => {
				window.alert("An error occured: ", e);
			});
	});

	// Refreshes the window, only available as debug
	ipcMain.on("refresh-window", () => {
		win.reload();
	});
}

app.whenReady().then(() => {
	createWindow();
	app.on("activate", function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", function () {
	if (process.platform !== "darwin") app.quit();
});
