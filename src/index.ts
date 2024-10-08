import './lib/setup';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import {GatewayIntentBits} from 'discord.js';
import {MongoClient} from 'mongodb';
import '@sapphire/plugin-hmr/register';
import {DeckBusinessLogic} from "./BusinessLogic/deckBL";
import { basicCommandUtils} from "./BusinessLogic/basicCommandUtils";
import { GameLogic } from './BusinessLogic/turnLogic';
import { InventoryManager } from './BusinessLogic/inventoryManager';

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
		eventDeck: import('mongodb').Collection;
		event: boolean;
		guilds: import('mongodb').Collection;
		characters: import('mongodb').Collection;
		gl: GameLogic;
		InventoryManager: InventoryManager;
		ownerId: string;
		effectTypes: { [key: string]: any };
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
		
		enabled: false,
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
			container.eventDeck = container.db.collection('EventDeck');
			container.utils = basicCommandUtils;
			container.InventoryManager = new InventoryManager();
			container.ownerId = process.env.OWNER_ID || '';
			// Set to true to enable event
			container.event = true;
			client.logger.info('Connected to MongoDB');
		} catch (error) {
			
			client.logger.fatal(error);
			await client.destroy();
			process.exit(1);
		}
		client.logger.info('Logging in');
		await client.login();
		client.logger.info(`Owner ID: ${container.ownerId}`);
		client.logger.info('logged in');
	} catch (error) {
		try {
			console.log('attempting to send message')
			// send a message to the owner
			// @ts-ignore FOR NOW
			client.application?.owner.send(`An error occurred: ${error}`);
		} catch (error) {
		
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
		}
	}
	container.deckBusinessLogic = new DeckBusinessLogic();
};

void main();
