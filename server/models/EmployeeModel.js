const mongoose = require("mongoose");

const EmployeeModel = mongoose.Schema({
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
	UserImage: {
		type: String,
		require: true,
	},
	Occupation: {
		type: String,
		require: true,
	},
	LoggedIn: {
		type: Boolean,
		require: true,
	},
});

module.exports = mongoose.model("EmployeeModel", EmployeeModel);
