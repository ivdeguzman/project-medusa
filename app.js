const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { app, BrowserWindow, ipcMain } = require("electron");
const isDev = require("electron-is-dev");

// If in development use electron-reload to watch for
// changes in the current directory
if (isDev) {
	require("electron-reload")(__dirname, {
		electron: require(`${__dirname}/node_modules/electron`),
	});
}

async function loadRest(win) {
	win.webContents.send("status-message", "RESTful API is loading...");

	// Routes
	const StudentRoute = require("./rest/routes/StudentRoute.js");
	const InstructorRoute = require("./rest/routes/InstructorRoute.js");

	// RESTful API
	const rest = express();
	rest.use(express.urlencoded({ extended: true }));
	rest.use(express.json());
	rest.use(cors());

	rest.use("/student", StudentRoute);
	rest.use("/instructor", InstructorRoute);

	rest.get("/", (req, res) => {
		res.send("Home Directory");
	});

	const uri =
		"mongodb://127.0.0.1:27017/project_medusa&gssapiServiceName=mongodb";
	rest.listen(process.env.PORT || 14500, () => {
		setTimeout(() => {
			win.webContents.send(
				"status-message",
				"RESTful API loaded successfully..."
			);
			setTimeout(() => {
				win.webContents.send("status-message", "Connecting to database...");
				setTimeout(() => {
					// Database
					mongoose.connect(
						uri,
						{ useNewUrlParser: true, useUnifiedTopology: true },
						(err) => {
							if (err != null) {
								setTimeout(() => {
									win.webContents.send(
										"status-message",
										"Connection error, exiting application..."
									);
									setTimeout(() => {
										app.quit();
									}, 1000);
								}, 1500);
							} else {
								setTimeout(() => {
									win.webContents.send(
										"status-message",
										"Connection established..."
									);
									setTimeout(() => {
										win.webContents.send(
											"status-message",
											"Starting application..."
										);
									}, 1000);
								}, 1500);
							}
						}
					);
				});
			}, 1000);
		}, 1500);
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
	win.once("ready-to-show", () => {
		setTimeout(() => {
			loadRest(win);
		}, 2000);
	});

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
