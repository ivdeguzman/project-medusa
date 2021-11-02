const express = require("express");
const StudentModel = require("../models/StudentModel");
const AttendanceModel = require("../models/AttendanceModel");
const router = express.Router();

router.post("/", async (req, res) => {
	const newStudent = new StudentModel({
		Name: {
			First: req.body.Name.First,
			Last: req.body.Name.Last,
		},
		Student: {
			Course: req.body.Student.Course,
			Year: req.body.Student.Year,
			Section: req.body.Student.Section,
		},
		UserImage: req.body.UserImage,
		LoggedIn: req.body.LoggedIn,
	});

	try {
		const saveNewUser = await newStudent.save();
		res.json(saveNewUser);
	} catch (err) {
		res.json({ message: err });
	}
});

module.exports = router;
