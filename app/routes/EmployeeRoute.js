const express = require("express");
const EmployeeModel = require(`../models/EmployeeModel`);
const AttendanceModel = require(`../models/AttendanceModel`);
const fs = require("fs");
const path = require("path");
const router = express.Router();

let isNumeric = (val) => {
	return /^-?\d+$/.test(val);
};

let end = 50;

router.get("/get/", async (req, res) => {
	EmployeeModel.count((err, number) => {
		if (err) res.send({ message: err });
		else {
			let indices = number / end;
			Number.isInteger(indices) && indices != 1
				? res.json({ count: indices })
				: indices <= 1
				? res.json({ count: 0 })
				: res.json({ count: parseInt(indices) + 1 });
		}
	});
});

router.get("/get/:start", async (req, res) => {
	let start;
	try {
		if (isNumeric(req.params.start)) {
			start = parseInt(req.params.start);
			const employeeData = await EmployeeModel.find()
				.sort({
					"Name.Last": 1,
					"Name.First": 1,
				})
				.skip((start - 1) * end)
				.limit(end);

			res.json(employeeData);
		}
	} catch (err) {
		res.json({ message: err });
	}
});

router.get("/attendance/get/:id/count", async (req, res) => {
	try {
		let indexCount;
		AttendanceModel.find({
			UserId: req.params.id,
		}).count((err, number) => {
			if (err) res.json(err);
			else {
				let indices = number / end;
				Number.isInteger(indices) && indices != 1
					? (indexCount = indices)
					: indices <= 1
					? (indexCount = 0)
					: (indexCount = parseInt(indices) + 1);
				res.json({ count: indexCount });
			}
		});
	} catch (err) {
		res.json(err);
	}
});

router.get("/attendance/get/:id/list/:index", async (req, res) => {
	try {
		const attendanceData = await AttendanceModel.find({
			UserId: req.params.id,
		})
			.sort({
				"Date.Month": -1,
				"Date.Day": -1,
				"Date.Year": -1,
				"Time.Hour": -1,
				"Time.Minute": -1,
				"Time.Second": -1,
			})
			.skip(req.params.index * end)
			.limit(end);
		res.json(attendanceData);
	} catch {
		res.json(err);
	}
});

router.post("/get/search", async (req, res) => {
	let query = req.body.Search.toLowerCase();
	let arrayResults = [];
	let queryCount = new Number();
	let indexStart = req.body.Index * end;
	let indexEnd = (req.body.Index + 1) * end;
	try {
		const employeeData = await EmployeeModel.aggregate([
			{
				$sort: {
					"Name.Last": 1,
					"Name.First": 1,
				},
			},
			{
				$project: {
					Data: {
						$concat: ["$Name.First", " ", "$Name.Last", " ", "$Occupation"],
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
			if (data.Data.toLowerCase().includes(query)) {
				arrayResults.push(data);
			}
		});
		queryCount = arrayResults.length / end;
		Number.isInteger(queryCount) && queryCount != 1
			? res.json({
					queryResults: arrayResults.slice(indexStart, indexEnd),
					queryIndexCount: queryCount,
			  })
			: queryCount <= 1
			? res.json({
					queryResults: arrayResults.slice(indexStart, indexEnd),
					queryIndexCount: 0,
			  })
			: res.json({
					queryResults: arrayResults.slice(indexStart, indexEnd),
					queryIndexCount: parseInt(queryCount) + 1,
			  });
	} catch (err) {
		res.json(er);
	}
});

router.post("/post", async (req, res) => {
	let folder = `${process.env.LOCALAPPDATA}/project_medusa`;
	let image1File = req.body.Images.First;
	let image2File = req.body.Images.Second;
	let image1Path = path.extname(image1File);
	let image2Path = path.extname(image2File);
	let uuid;
	try {
		const newEmployeeData = new EmployeeModel({
			Name: {
				First: req.body.Name.First,
				Last: req.body.Name.Last,
			},
			Occupation: req.body.Occupation,
			LoggedIn: false,
		});
		await newEmployeeData.save((err, employee) => {
			if (err) throw err;
			uuid = employee._id.toString();

			fs.mkdir(`${folder}/${uuid}/`, (err) => {
				if (err) {
					console.log(err);
					throw err;
				}
			});
			fs.copyFile(image1File, `${folder}/${uuid}/1${image1Path}`, (err) => {
				if (err) {
					console.log(err);
					throw err;
				}
			});
			fs.copyFile(image2File, `${folder}/${uuid}/2${image2Path}`, (err) => {
				if (err) {
					console.log(err);
					throw err;
				}
			});
		});
		res.json({ status: 1 });
	} catch {
		res.json({ status: 0 });
	}
});

router.delete("/delete/:user", async (req, res) => {
	let folder = `${process.env.LOCALAPPDATA}/project_medusa/${req.params.user}`;
	try {
		await EmployeeModel.deleteOne({ _id: req.params.user });
		await AttendanceModel.deleteMany({ UserId: req.params.user });
		fs.rm(folder, { recursive: true }, (err) => {
			if (err) throw err;
		});
		res.json({ status: 1 });
	} catch {
		res.json({ status: 0 });
	}
});

router.delete("/delete/:user/history", async (req, res) => {
	try {
		await AttendanceModel.deleteMany({ UserId: req.params.user });
		res.json({ status: 1 });
	} catch {
		res.json({ status: 0 });
	}
});

router.patch("/patch/:user", async (req, res) => {
	try {
		await EmployeeModel.updateOne(
			{ _id: req.params.user },
			{
				$set: {
					Name: {
						First: req.body.Name.First,
						Last: req.body.Name.Last,
					},
					Occupation: req.body.Occupation,
					LoggedIn: req.body.LoggedIn,
				},
			}
		);
		res.json({ status: 1 });
	} catch {
		res.json({ status: 0 });
	}
});

module.exports = router;
