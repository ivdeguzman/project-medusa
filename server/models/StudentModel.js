const mongoose = require("mongoose");

const StudentModel = mongoose.Schema({
	Name: {
		First: {
			type: String,
			required: true,
		},
		Last: {
			type: String,
			required: true,
		},
	},
	Student: {
		Course: {
			type: String,
			required: true,
		},
		Year: {
			type: Number,
			required: true,
		},
		Section: {
			type: Number,
			required: true,
		},
	},
	LoggedIn: {
		type: Boolean,
		require: true,
	},
});

module.exports = mongoose.model("StudentModel", StudentModel);
