const mongoose = require("mongoose");

let cachedConnectionPromise = null;

async function connectDatabase(mongoUri, mongoDbName) {
	if (!mongoUri) {
		throw new Error("MONGO_URI belum diatur");
	}

	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	if (cachedConnectionPromise) {
		return cachedConnectionPromise;
	}

	cachedConnectionPromise = mongoose.connect(mongoUri, {
		dbName: mongoDbName || undefined,
	});

	try {
		await cachedConnectionPromise;
		return mongoose.connection;
	} catch (error) {
		cachedConnectionPromise = null;
		throw error;
	}
}

module.exports = {
	connectDatabase,
};
