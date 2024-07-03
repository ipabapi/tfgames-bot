import './lib/setup';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import {GatewayIntentBits} from 'discord.js';
import { MongoClient } from 'mongodb';
import '@sapphire/plugin-hmr/register';
import {DeckBusinessLogic} from "./BusinessLogic/deckBL";
import { basicCommandUtils} from "./BusinessLogic/basicCommandUtils";
import { GameLogic } from './BusinessLogic/turnLogic';

// Declare items to be on the container

declare module '@sapphire/framework' {
	interface Container {
		mongoClient: MongoClient;
		testDB: import('mongodb').Db;
		deckBusinessLogic : DeckBusinessLogic;
		utils: typeof basicCommandUtils;
		db: import('mongodb').Db;
		users: import('mongodb').Collection;
		game: import('mongodb').Collection;
		deck: import('mongodb').Collection;
		cards: import('mongodb').Collection;
		guilds: import('mongodb').Collection;
		characters: import('mongodb').Collection;
		gl: GameLogic;
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
			// container.mongoClient = await MongoClient.connect(mongoUri);
			// container.mongoClient.on('error', (error) => client.logger.error(error));
			// container.testDB = container.mongoClient.db('test');
			container.gl = new GameLogic();
			const mongoDB = await MongoClient.connect(mongoUri);
			container.db = mongoDB.db('test');
			container.users = container.db.collection('users');
			container.game = container.db.collection('game');
			container.deck = container.db.collection('deck');
			container.cards = container.db.collection('cards');
			container.guilds = container.db.collection('guilds');
			container.characters = container.db.collection('characters');
			container.utils = basicCommandUtils;
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
	container.deckBusinessLogic = new DeckBusinessLogic();
};

void main();
