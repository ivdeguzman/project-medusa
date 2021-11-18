const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const isDev = require("electron-is-dev");
const http = require("http");

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
	const io = require("socket.io")(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST", "PATCH", "INSERT"],
		},
	});

	// Routes
	const StudentRoute = require("./server/routes/StudentRoute.js");
	const EmployeeRoute = require("./server/routes/EmployeeRoute.js");

	// Models
	const StudentModel = require("./server/models/StudentModel.js");
	const EmployeeModel = require("./server/models/EmployeeModel.js");
	const AttendanceModel = require("./server/models/AttendanceModel");

	// RESTful API
	rest.use(express.urlencoded({ extended: true }));
	rest.use(express.json());
	rest.use(cors());
	rest.use("/", express.static(`${__dirname}/server/app`));
	rest.use(
		"/files",
		express.static(`${process.env.LOCALAPPDATA}/project_medusa`)
	);
	rest.get(/.*/, (req, res) =>
		res.sendFile(`${__dirname}/server/app/index.html`)
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
		const attendanceChangeStream = connection
			.collection("attendancemodels")
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
						LoggedIn: change.fullDocument.LoggedIn,
					};
					io.emit("studentDataUpdate", Student);
					break;
				case "delete":
					io.emit("studentDataDelete", change.documentKey._id);
					break;
			}
		});

		attendanceChangeStream.on("change", (change) => {
			let Attendance;
			switch (change.operationType) {
				case "insert":
					Attendance = {
						_id: change.fullDocument._id,
						UserId: change.fullDocument.UserId,
						Time: {
							Hour: change.fullDocument.Time.Hour,
							Minute: change.fullDocument.Time.Minute,
							Second: change.fullDocument.Time.Second,
						},
						Date: {
							Day: change.fullDocument.Date.Day,
							Month: change.fullDocument.Date.Month,
							Year: change.fullDocument.Date.Year,
						},
						LoggedIn: change.fullDocument.LoggedIn,
						Via: change.fullDocument.Via,
					};
					io.emit("attendanceDataInsert", Attendance);
					break;
				case "update":
					Attendance = {
						_id: change.fullDocument._id,
						UserId: change.fullDocument.UserId,
						Time: {
							Hour: change.fullDocument.Time.Hour,
							Minute: change.fullDocument.Time.Minute,
							Second: change.fullDocument.Time.Second,
						},
						Date: {
							Day: change.fullDocument.Date.Day,
							Month: change.fullDocument.Date.Month,
							Year: change.fullDocument.Date.Year,
						},
						LoggedIn: change.fullDocument.LoggedIn,
						Via: change.fullDocument.Via,
					};
					io.emit("attendanceDataUpdate", Attendance);
					break;
				case "delete":
					io.emit("attendanceDataDelete", change.documentKey._id);
					break;
			}
		});
	});

	io.on("connection", (socket) => {
		let start = 0;
		let end = 5;
		console.log(socket.id + " has connected.");

		// Fetch Document Count Upon Connection (No User Interaction)
		socket.on("employeeDocumentCountGet", async () => {
			EmployeeModel.count((err, number) => {
				if (err) socket.emit("employeeDocumentRetrieveList", "Error");
				else {
					let indices = number / end;
					Number.isInteger(indices) && indices != 1
						? socket.emit("employeeDocumentRetrieveList", indices)
						: indices <= 1
						? socket.emit("employeeDocumentRetrieveList", 0)
						: socket.emit(
								"employeeDocumentRetrieveList",
								parseInt(indices) + 1
						  );
					indices = undefined;
				}
			});
		});
		socket.on("studentDocumentCountGet", async () => {
			StudentModel.count((err, number) => {
				if (err) socket.emit("studentDocumentRetrieveList", "Error");
				else {
					let indices = number / end;
					Number.isInteger(indices) && indices != 1
						? socket.emit("studentDocumentRetrieveList", indices)
						: indices <= 1
						? socket.emit("studentDocumentRetrieveList", 0)
						: socket.emit("studentDocumentRetrieveList", parseInt(indices) + 1);
					indices = undefined;
				}
			});
		});
		socket.on("attendanceDocumentCountGet", async (id) => {
			AttendanceModel.find({
				UserId: id,
			}).count((err, number) => {
				if (err) socket.emit("attendanceDocumentRetriveList", "Error");
				else {
					let indices = number / end;
					Number.isInteger(indices) && indices != 1
						? socket.emit("attendanceDocumentRetrieveList", indices)
						: indices <= 1
						? socket.emit("attendanceDocumentRetrieveList", 0)
						: socket.emit(
								"attendanceDocumentRetrieveList",
								parseInt(indices) + 1
						  );
					indices = undefined;
				}
			});
		});
		socket.on("sectionDocumentCountGet", async () => {
			let indices = (await StudentModel.distinct("Student")).length / 9;
			Number.isInteger(indices) && indices != 1
				? socket.emit("sectionDocumentRetrieveList", indices)
				: indices <= 1
				? socket.emit("sectionDocumentRetrieveList", 0)
				: socket.emit("sectionDocumentRetrieveList", parseInt(indices) + 1);
			indices = undefined;
		});

		// Fetch Data Upon Connection (No User Interaction)
		socket.on("employeeDataGet", async (index = start) => {
			try {
				const employeeData = await EmployeeModel.find()
					.sort({
						Occupation: 1,
						"Name.Last": 1,
						"Name.First": 1,
					})
					.skip(index * end)
					.limit(end);
				socket.emit("employeeDataRetrieveList", employeeData);
			} catch (err) {
				socket.emit("employeeDataRetrieveList", "Error");
			}
		});
		socket.on("studentDataGet", async (index = start) => {
			try {
				const studentData = await StudentModel.find()
					.sort({
						"Student.Course": 1,
						"Student.Year": 1,
						"Student.Section": 1,
						"Name.Last": 1,
						"Name.First": 1,
					})
					.skip(index * end)
					.limit(end);
				socket.emit("studentDataRetrieveList", studentData);
			} catch (err) {
				socket.emit("studentDataRetrieveList", "Error");
			}
		});
		socket.on("attendanceDataGet", async (id, index = start) => {
			try {
				const attendanceData = await AttendanceModel.find({
					UserId: id,
				})
					.sort({
						"Date.Month": -1,
						"Date.Day": -1,
						"Date.Year": -1,
						"Time.Hour": -1,
						"Time.Minute": -1,
						"Time.Second": -1,
					})
					.skip(index * end)
					.limit(end);
				socket.emit("attendanceDataRetrieveList", attendanceData);
			} catch (err) {
				socket.emit("attendanceDataRetrieveList", "Error");
			}
		});
		socket.on("sectionDataGet", async (index = start) => {
			try {
				const sectionData = await StudentModel.find()
					.sort({
						"Student.Course": 1,
						"Student.Year": 1,
						"Student.Section": 1,
					})
					.distinct("Student");
				socket.emit(
					"sectionDataRetrieveList",
					sectionData.slice(index * 9, (index + 1) * 9)
				);
			} catch (err) {
				socket.emit("sectionDataRetrieveList", "Error");
			}
		});
		socket.on("studentPerSectionDataGet", async (object) => {
			try {
				const studentPerSectionData = await StudentModel.find({
					Student: {
						Course: object.Student.Course,
						Year: object.Student.Year,
						Section: object.Student.Section,
					},
				}).sort({
					"Name.Last": 1,
					"Name.First": 1,
				});
				socket.emit("studentPerSectionDataRetrieveList", studentPerSectionData);
			} catch (err) {
				socket.emit("studentPerSectionDataRetrieveList", "Error");
			}
		});

		// Post Data Upon Request (User Interaction Available)
		socket.on("studentDataPostRequest", async (StudentData) => {
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
				await newStudentData.save();
				socket.emit("userDataPostStatus", 1);
			} catch (err) {
				socket.emit("userDataPostStatus", 0);
			}
		});
		socket.on("employeeDataPostRequest", async (EmployeeData) => {
			const newEmployeeData = new EmployeeModel({
				Name: {
					First: EmployeeData.Name.First,
					Last: EmployeeData.Name.Last,
				},
				Occupation: EmployeeData.Occupation,
				LoggedIn: false,
			});

			try {
				await newEmployeeData.save();
				socket.emit("userDataPostStatus", 1);
			} catch (err) {
				socket.emit("userDataPostStatus", 0);
			}
		});

		// Delete Data Upon Request (User Interaction Available)
		socket.on("studentDataDeleteRequest", async (selectedProfile) => {
			try {
				await StudentModel.deleteOne({ _id: selectedProfile._id });
				await AttendanceModel.deleteMany({ UserId: selectedProfile._id });
				socket.emit("userDataDeleteStatus", 1);
			} catch {
				socket.emit("userDataDeleteStatus", 0);
			}
		});
		socket.on("employeeDataDeleteRequest", async (selectedProfile) => {
			try {
				await EmployeeModel.deleteOne({ _id: selectedProfile._id });
				await AttendanceModel.deleteMany({ UserId: selectedProfile._id });
				socket.emit("userDataDeleteStatus", 1);
			} catch {
				socket.emit("userDataDeleteStatus", 0);
			}
		});

		// Delete History Only Upon Request (User Interaction Available)
		socket.on("userHistoryDeleteRequest", async (selectedProfile) => {
			try {
				await AttendanceModel.deleteMany({ UserId: selectedProfile._id });
				socket.emit("userHistoryDeleteStatus", 1);
			} catch {
				socket.emit("userHistoryDeleteStatus", 0);
			}
		});

		// Patch Profile Upon Request (User Interaction Available)
		socket.on("studentDataPatchRequest", async (selectedProfile) => {
			try {
				await StudentModel.updateOne(
					{ _id: selectedProfile._id },
					{
						$set: {
							Name: {
								First: selectedProfile.Name.First,
								Last: selectedProfile.Name.Last,
							},
							Student: {
								Course: selectedProfile.Student.Course,
								Year: selectedProfile.Student.Year,
								Section: selectedProfile.Student.Section,
							},
						},
					}
				);
				socket.emit("userDataPatchStatus", 1);
			} catch {
				socket.emit("userDataPatchStatus", 0);
			}
		});
		socket.on("employeeDataPatchRequest", async (selectedProfile) => {
			try {
				await EmployeeModel.updateOne(
					{ _id: selectedProfile._id },
					{
						$set: {
							Name: {
								First: selectedProfile.Name.First,
								Last: selectedProfile.Name.Last,
							},
							Occupation: selectedProfile.Occupation,
						},
					}
				);
				socket.emit("userDataPatchStatus", 1);
			} catch {
				socket.emit("userDataPatchStatus", 0);
			}
		});

		// Search Query (User Interaction Available)
		socket.on("searchQuery", async (query, model) => {
			let regEx = new RegExp(`${query}`, "i");
			let arrayResults = [];
			let indices = new Number();
			if (!(query.length <= 2)) {
				try {
					switch (model) {
						case "student":
							const studentData = await StudentModel.aggregate([
								{
									$sort: {
										"Student.Course": 1,
										"Student.Year": 1,
										"Student.Section": 1,
										"Name.First": 1,
										"Name.Last": 1,
									},
								},
								{
									$project: {
										Data: {
											$concat: [
												"$Name.First",
												" ",
												"$Name.Last",
												" ",
												"$Student.Course",
												" ",
												{
													$toString: "$Student.Year",
												},
												"-",
												{
													$toString: "$Student.Section",
												},
											],
										},
										_id: "$_id",
										Name: {
											First: "$Name.First",
											Last: "$Name.Last",
										},
										Student: {
											Course: "$Student.Course",
											Year: "$Student.Year",
											Section: "$Student.Section",
										},
										LoggedIn: "$LoggedIn",
									},
								},
							]);
							studentData.forEach((data) => {
								if (data.Data.match(regEx)) {
									arrayResults.push(data);
								}
							});
							break;
						case "employee":
							const employeeData = await EmployeeModel.aggregate([
								{
									$sort: {
										"Name.First": 1,
										"Name.Last": 1,
										Occupation: 1,
									},
								},
								{
									$project: {
										Data: {
											$concat: [
												"$Name.First",
												" ",
												"$Name.Last",
												" ",
												"$Occupation",
											],
										},
										_id: "$_id",
										Name: {
											First: "$Name.First",
											Last: "$Name.Last",
										},
										Occupation: "$Occupation",
										LoggedIn: "$LoggedIn",
									},
								},
							]);
							employeeData.forEach((data) => {
								if (data.Data.match(regEx)) {
									arrayResults.push(data);
								}
							});
							break;
					}
					indices = arrayResults.length;
					socket.emit("searchResults", arrayResults);
				} catch (err) {
					socket.emit("searchResults", "Error");
				}
			}
		});

		// Raspberry Pi Init API (DO NOT GIVE TO OTHERS)
		socket.on("raspberryPiInitRequest", async () => {
			let usersArray = [];
			try {
				const studentData = await StudentModel.aggregate([
					{
						$project: {
							_id: "$_id",
						},
					},
				]);
				const employeeData = await EmployeeModel.aggregate([
					{
						$project: {
							_id: "$_id",
						},
					},
				]);
				usersArray = [...studentData, ...employeeData];
				socket.emit("raspberryPiInitStatus", usersArray);
			} catch {
				socket.emit("raspberryPiInitStatus", "Error");
			}
		});

		// Login Switcher Either Web Or IoT (User Interaction Available)
		socket.on("loginChangeRequest", async (id, device) => {
			try {
				let dataSeleceted;
				let modelSeleceted;
				let modelName;
				const dateObject = new Date();
				studentData = await StudentModel.find({ _id: id });
				employeeData = await EmployeeModel.find({ _id: id });
				if (studentData.length != 0) {
					dataSeleceted = studentData[0];
					modelSeleceted = 0;
				} else {
					dataSeleceted = employeeData[0];
					modelSeleceted = 1;
				}
				if (modelSeleceted == 0) modelName = StudentModel;
				else modelName = EmployeeModel;
				let newAttendance = new AttendanceModel({
					UserId: dataSeleceted._id,
					Time: {
						Hour: ("0" + dateObject.getHours()).slice(-2),
						Minute: ("0" + dateObject.getMinutes()).slice(-2),
						Second: ("0" + dateObject.getSeconds()).slice(-2),
					},
					Date: {
						Day: dateObject.getDate(),
						Month: ("0" + (dateObject.getMonth() + 1)).slice(-2),
						Year: dateObject.getFullYear(),
					},
					LoggedIn: !dataSeleceted.LoggedIn,
					Via: device,
				});
				try {
					await newAttendance.save();
					await modelName.updateOne(
						{ _id: dataSeleceted._id },
						{
							$set: {
								LoggedIn: !dataSeleceted.LoggedIn,
							},
						}
					);
					socket.emit("loginChangeStatus", "Success");
				} catch {
					socket.emit("loginChangeStatus", "Failure in Post");
				}
			} catch (err) {
				socket.emit("loginChangeStatus", "Failure in Fetch");
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

	ipcMain.on("refresh-window", () => {
		win.reload();
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
