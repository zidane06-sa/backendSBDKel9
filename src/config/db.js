const mongoose = require("mongoose");

async function connectDatabase(mongoUri, mongoDbName) {
	if (!mongoUri) {
		throw new Error("MONGO_URI belum diatur");
	}

	await mongoose.connect(mongoUri, {
		dbName: mongoDbName || undefined,
	});

	return mongoose.connection;
}

module.exports = {
	connectDatabase,
};
