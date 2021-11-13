const mongoose = require("mongoose");

const AttendanceModel = mongoose.Schema({
	UserId: {
		type: String,
		require: true,
	},
	Time: {
		Hour: {
			type: Number,
			require: true,
		},
		Minute: {
			type: Number,
			require: true,
		},
		Second: {
			type: Number,
			require: true,
		},
	},
	Date: {
		Day: {
			type: Number,
			require: true,
		},
		Month: {
			type: Number,
			require: true,
		},
		Year: {
			type: Number,
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
