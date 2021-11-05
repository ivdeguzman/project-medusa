const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const isDev = require("electron-is-dev");
const http = require("http");
const socketio = require("socket.io");

// If in development use electron-reload to watch for
// changes in the current directory
if (isDev) {
	require("electron-reload")(__dirname, {
		electron: require(`${__dirname}/node_modules/electron`),
	});
}

async function loadRest(win) {
	win.webContents.send("status-message", "RESTful API is loading...");

	// Library Init
	const rest = express();
	const server = http.createServer(rest);
	const io = socketio(server);

	// Routes
	const StudentRoute = require("./server/routes/StudentRoute.js");
	const EmployeeRoute = require("./server/routes/EmployeeRoute.js");

	// Models
	const StudentModel = require("./server/models/StudentModel.js");
	const EmployeeModel = require("./server/models/EmployeeModel.js");

	// RESTful API
	rest.use(express.urlencoded({ extended: true }));
	rest.use(express.json());
	rest.use(cors());
	rest.use(express.static("./server/app"));
	rest.get(/.*/, (req, res) =>
		res.sendFile(__dirname + "/server/app/index.html")
	);

	// Database And Sockets
	const uri =
		"mongodb://127.0.0.1:27017/project_medusa?replicaSet=project%40medusa";
	server.listen(process.env.PORT || 14500, () => {
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

	// UI Update Via Socket.io (No User Interaction)
	const connection = mongoose.connection;
	connection.once("open", () => {
		const employeeChangeStream = connection
			.collection("employeemodels")
			.watch({ fullDocument: "updateLookup" });
		const studentChangeStream = connection
			.collection("studentmodels")
			.watch({ fullDocument: "updateLookup" });

		employeeChangeStream.on("change", (change) => {
			let Employee;
			switch (change.operationType) {
				case "insert":
					Employee = {
						_id: change.fullDocument._id,
						Name: {
							First: change.fullDocument.Name.First,
							Last: change.fullDocument.Name.Last,
						},
						Occupation: change.fullDocument.Occupation,
						LoggedIn: change.fullDocument.LoggedIn,
					};
					io.emit("employeeDataInsert", Employee);
					break;
				case "update":
					Employee = {
						_id: change.fullDocument._id,
						Name: {
							First: change.fullDocument.Name.First,
							Last: change.fullDocument.Name.Last,
						},
						Occupation: change.fullDocument.Occupation,
						LoggedIn: change.fullDocument.LoggedIn,
					};
					io.emit("employeeDataUpdate", Employee);
					break;
				case "delete":
					io.emit("employeeDataDelete", change.documentKey._id);
					break;
			}
		});

		studentChangeStream.on("change", (change) => {
			let Student;
			switch (change.operationType) {
				case "insert":
					Student = {
						_id: change.fullDocument._id,
						Name: {
							First: change.fullDocument.Name.First,
							Last: change.fullDocument.Name.Last,
						},
						Student: {
							Course: change.fullDocument.Student.Course,
							Year: change.fullDocument.Student.Year,
							Section: change.fullDocument.Student.Section,
						},
						UserImage: change.fullDocument.UserImage,
						LoggedIn: change.fullDocument.LoggedIn,
					};
					io.emit("studentDataInsert", Student);
					break;
				case "update":
					Student = {
						_id: change.fullDocument._id,
						Name: {
							First: change.fullDocument.Name.First,
							Last: change.fullDocument.Name.Last,
						},
						Student: {
							Course: change.fullDocument.Student.Course,
							Year: change.fullDocument.Student.Year,
							Section: change.fullDocument.Student.Section,
						},
						UserImage: change.fullDocument.UserImage,
						LoggedIn: change.fullDocument.LoggedIn,
					};
					io.emit("studentDataUpdate", Student);
					break;
				case "delete":
					io.emit("studentDataDelete", change.documentKey._id);
					break;
			}
		});
	});

	io.on("connection", (socket) => {
		console.log(socket.id + " has connected.");

		// Fetch Data Upon Connection (No User Interaction)
		socket.on("employeeDataGet", async () => {
			try {
				const employeeData = await EmployeeModel.find();
				socket.emit("employeeDataRetriveList", employeeData);
			} catch (err) {
				socket.emit("employeeDataRetriveList", "Error");
			}
		});
		socket.on("studentDataGet", async () => {
			try {
				const studentData = await StudentModel.find();
				socket.emit("studentDataRetriveList", studentData);
			} catch (err) {
				socket.emit("studentDataRetriveList", "Error");
			}
		});

		// Post Data Upon Request (User Interaction Available)
		socket.on("student-data-post-request", (StudentData) => {
			const newStudentData = new StudentModel({
				Name: {
					First: StudentData.Name.First,
					Last: StudentData.Name.Last,
				},
				Student: {
					Course: StudentData.Student.Course,
					Year: StudentData.Student.Year,
					Section: StudentData.Student.Section,
				},
				LoggedIn: false,
			});

			try {
				newStudentData.save();
				socket.emit("user-data-post-status", 1);
			} catch (err) {
				socket.emit("user-data-post-status", 0);
			}
		});
		socket.on("employee-data-post-request", (EmployeeData) => {
			const newEmployeeData = new EmployeeModel({
				Name: {
					First: EmployeeData.Name.First,
					Last: EmployeeData.Name.Last,
				},
				Occupation: EmployeeData.Occupation,
				LoggedIn: false,
			});

			try {
				newEmployeeData.save();
				socket.emit("user-data-post-status", 1);
			} catch (err) {
				socket.emit("user-data-post-status", 0);
			}
		});
	});
}

async function createWindow() {
	// Create the browser window with node integration
	const win = new BrowserWindow({
		minWidth: 960,
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
		win.isMaximized() ? win.restore() : win.maximize();
	});

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
