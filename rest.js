const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { BrowserWindow } = require("express");

module.exports = function (window) {
	const StudentRoute = require(`${__dirname}/app/routes/StudentRoute.js`);
	const EmployeeRoute = require(`${__dirname}/app/routes/EmployeeRoute.js`);

	const StudentModel = require(`${__dirname}/app/models/StudentModel.js`);
	const EmployeeModel = require(`${__dirname}/app/models/EmployeeModel.js`);
	const AttendanceModel = require(`${__dirname}/app/models/AttendanceModel.js`);

	const app = express();
	const server = http.createServer(app);
	const io = require("socket.io")(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST", "PATCH", "INSERT"],
		},
	});

	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());
	app.use(cors());

	app.use("/", express.static(`${__dirname}/app/serve/public`));
	app.use("/admin", express.static(`${__dirname}/app/serve/admin`));
	app.use(
		"/files",
		express.static(`${process.env.LOCALAPPDATA}/project_medusa`)
	);

	app.use("/api/student", StudentRoute);
	app.use("/api/employee", EmployeeRoute);

	app.post("/api/status-change", async (req, res) => {
		try {
			let dataSeleceted;
			let modelSeleceted;
			let modelName;
			let device = req.body.device;
			const dateObject = new Date();
			studentData = await StudentModel.find({ _id: req.body.id });
			employeeData = await EmployeeModel.find({ _id: req.body.id });
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
				res.json({ status: 1, profile: dataSeleceted });
			} catch {
				res.json({ status: 0, message: "Failure in Post" });
			}
		} catch (err) {
			console.log(err);
			res.json({ status: 0, message: "Failure in Fetch" });
		}
	});

	app.get(/.*/, (req, res) =>
		res.sendFile(`${__dirname}/app/serve/public/index.html`)
	);

	const uri =
		"mongodb://localhost:27017/project_medusa?replicaSet=project%40medusa";

	server.listen(process.env.PORT || 14500, () => {
		mongoose.connect(
			uri,
			{ useNewUrlParser: true, useUnifiedTopology: true },
			(err) => {
				if (err != null) {
					setTimeout(() => {
						window.webContents.send("status-message", false);
					}, 5000);
				} else {
					setTimeout(() => {
						window.webContents.send("status-message", true);
					}, 5000);
				}
			}
		);
	});

	io.of("/raspberry").on("connection", (socket) => {
		window.webContents.send("raspberry-is-online", true);

		socket.on("disconnect", () => {
			window.webContents.send("raspberry-is-online", false);
		});

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
	});
};
