// types/index.d.ts

import { ChatInputCommandInteraction, CacheType } from 'discord.js';
import { Game, Player } from '../bot.types';
import { MongoClient } from 'mongodb';
import { basicCommandUtils } from '../../BusinessLogic/basicCommandUtils';
import { DeckBusinessLogic } from '../../BusinessLogic/deckBL';
import { InventoryManager } from '../../BusinessLogic/inventoryManager';
import { GameLogic } from '../../BusinessLogic/turnLogic';


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
		InventoryManager: InventoryManager;
		ownerId: string;
		effectTypes: { [key: string]: any };
	}

}
declare module 'discord.js' {
  interface ChatInputCommandInteraction<Cached extends CacheType = CacheType> {
    userData?: {
      game: Game;
      player: Player;
    };
  }

  interface CommandInteraction<Cached extends CacheType = CacheType> {
	userData?: {
	  game: Game;
	  player: Player;
	};
  }
}
