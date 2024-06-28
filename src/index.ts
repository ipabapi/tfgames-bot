import './lib/setup';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { MongoClient } from 'mongodb';
import '@sapphire/plugin-hmr/register';

// Declare items to be on the container

declare module '@sapphire/framework' {
	interface Container {
		mongoClient: MongoClient;
		testDB: import('mongodb').Db;
	}
}

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
	throw new Error('Mongo URI is not provided');
}


const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	hmr: {
		
		enabled: true,
	}
});

const main = async () => {
	try {
		try {
			container.mongoClient = await MongoClient.connect(mongoUri);
			container.mongoClient.on('error', (error) => client.logger.error(error));
			container.testDB = container.mongoClient.db('test');
			client.logger.info('Connected to MongoDB');
		} catch (error) {
			client.logger.fatal(error);
			await client.destroy();
			process.exit(1);
		}
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
