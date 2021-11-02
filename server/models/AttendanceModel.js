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
});

module.exports = mongoose.model("AttendanceModel", AttendanceModel);
