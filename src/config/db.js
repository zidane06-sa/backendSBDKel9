const mongoose = require("mongoose");
const dns = require("dns");

let cachedConnectionPromise = null;

let dnsConfigured = false;

function configureDnsServers() {
	if (dnsConfigured) {
		return;
	}

	const customServers = (process.env.MONGO_DNS_SERVERS || "1.1.1.1,8.8.8.8")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);

	if (customServers.length > 0) {
		try {
			dns.setServers(customServers);
		} catch (_error) {
			// Keep default resolvers if custom DNS cannot be applied.
		}
	}

	dnsConfigured = true;
}

async function connectDatabase(mongoUri, mongoDbName) {
	if (!mongoUri) {
		throw new Error("MONGO_URI belum diatur");
	}

	configureDnsServers();

	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	if (cachedConnectionPromise) {
		return cachedConnectionPromise;
	}

	mongoose.set('autoIndex', true);
	cachedConnectionPromise = mongoose.connect(mongoUri, {
		dbName: mongoDbName || undefined,
		autoIndex: true,
		serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 15000,
		connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 15000,
		socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
		family: 4,
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
