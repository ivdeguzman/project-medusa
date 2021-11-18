const mongoose = require("mongoose");

const AttendanceModel = mongoose.Schema({
	UserId: {
		type: String,
		require: true,
	},
	Time: {
		Hour: {
			type: String,
			require: true,
		},
		Minute: {
			type: String,
			require: true,
		},
		Second: {
			type: String,
			require: true,
		},
	},
	Date: {
		Day: {
			type: String,
			require: true,
		},
		Month: {
			type: String,
			require: true,
		},
		Year: {
			type: String,
			require: true,
		},
	},
	LoggedIn: {
		type: Boolean,
		require: true,
	},
	Via: {
		type: String,
		require: true,
	},
});

module.exports = mongoose.model("AttendanceModel", AttendanceModel);
