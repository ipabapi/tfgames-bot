import { container } from '@sapphire/framework';
import { GameState, Game, GameStatus, Player } from '../lib/bot.types';
import { ObjectId } from 'mongodb';

export class GameLogic {
	constructor() {}

	/**
	 * Draw a card from the deck
	 * @param game The current game state
	 * @returns The card drawn and the updated game state
	 */
	public async drawCard(game: GameState) {
		// Check if deck is empty
		if (game.deck.length === 0) {
			// move discard pile to deck
			game.deck = game.discard;
			game.discard = [];
			// shuffle deck
			game.deck = game.deck.sort(() => Math.random() - 0.5);
		}
		// Grab the first card from the array
		const cardData = game.deck.shift();
		if (!cardData) {
			throw new Error('Card is undefined, how did this happen?');
		}
		const card = await container.cards.findOne({ stringID: cardData });
		if (!card) {
			throw new Error('Card not found, how did this happen?');
		}
		// move card to discard pile and lastCard

		game.discard.unshift(cardData);
		game.status = GameStatus.WAITING;
		game.pass = true;
		//@ts-ignore
		game.lastCard = card;
		// return the card and the game
		return game;
	}

	/**
	 * Advance the turn to the next player
	 * @param game The current game state
	 * @returns The updated game state
	 * @throws Error if lastPlayer, currentPlayer, or turnOrder is undefined or empty
	 */
	public async advanceTurn(game: GameState) {
		// Change last player to current player
		game.lastPlayer = game.currentPlayer;
		if (!game.lastPlayer) {
			throw new Error('Last player is undefined, how did this happen?');
		}
		if (!game.turnOrder.length) {
			throw new Error('Turn order is empty, how did this happen?');
		}
		game.failClaim = null;
		// Advance the turn
        // Check if extraTurnUsed is true
        if (game.extraTurnUsed && game.extraTurn) {
            game.extraTurnUsed = false;
            game.extraTurn = false;
        } else if (game.extraTurn && !game.extraTurnUsed) {
            game.extraTurn = true;
            game.status = GameStatus.TURNSTART;
            return game;
        }
		// Check if there is anything in active steals
		console.log(game.stealsActive)
		if (Object.keys(game.stealsActive).length >	0) {
			// If there is, check if the next player is the target of a steal
			if (game.stealsActive[game.turnOrder[0].userId]) {
				// If they are, advance the turn to the player who stole from them
				const nextPlayer = game.stealsActive[game.turnOrder[0].userId];
				delete game.stealsActive[game.turnOrder[0].userId];
				const player = game.turnOrder.find((player) => player.userId === nextPlayer);
				if (!player) {
					throw new Error('Player not found, how did this happen?');
				}
				game.currentPlayer = player;
			}
		} else {
			game.currentPlayer = game.turnOrder.shift() || null;
		}
		if (!game.currentPlayer) {
			throw new Error('Current player is undefined, how did this happen?');
		}
        // Check if the current player is in turn order already, if so don't add them again
        if (!game.turnOrder.find((player) => player.userId === game.currentPlayer?.userId)) {
            game.turnOrder.push(game.currentPlayer);
        }
		game.pass = false;
		game.status = GameStatus.TURNSTART;
		// return the game
		return game;
	}

	/**
	 * This function will remove a player from the game state, and update the game state accordingly, including removing the player from the turn order or advancing the turn if the player is the current player
	 * @param game The current game state
	 * @param user The user to remove
	 * @returns The updated game state
	 */

	public async removePlayer(game: Game, user: string) {
		// Remove the player from the game
		delete game.players[user];
		// Remove the player from the turn order
		game.state.turnOrder = game.state.turnOrder.filter((player) => player.userId !== user);
		// If the player is the current player, advance the turn
		if (game.state.currentPlayer?.userId === user) {
			game.state = await this.advanceTurn(game.state);
		}
		// Return the game
		return game;
	}

	/**
	 * Add a player to the game state
	 * @param game The current game state
	 * @param user The user to add
	 * @returns The updated game state
	 */
	public async addPlayer(game: GameState, user: Player, channel: string) {
		// insert player before last index of turn order
		game.turnOrder.splice(game.turnOrder.length - 1, 0, user);
		await container.game.updateOne({ channel: channel }, { $set: { state: game } });
		return game;
	}

	/**
	 * Apply a physical or mental effect to a player
	 * @param game The current game state
	 * @param effect The effect to apply
	 * @param type The type of effect to apply, true for physical, false for mental
	 * @returns An array containing the updated game state, a boolean indicating if the effect was successful, and a string with an error message if the effect was not successful
	 * @throws Error if the effect is not valid, or if the player is not found
	 */
	public async applyEffect(game: Game, effect: string, targetUser: string, type: boolean) {
		if (effect == '') {
			return [game, false, 'Effect is empty'];
		}
		// Find the player
		const player = Object.keys(game.players).find((player) => player === targetUser);
		if (!player) {
			return [game, false, 'Player not found, are you sure they are in the game?'];
		}
		// Apply the effect
		console.log(game, player, game.players[player].character, effect, type)
		const character = await container.characters.findOne({ _id: new ObjectId(game.players[player].character) });
		console.log(character, !character)
		if (!character) {
			return [game, false, 'Character not found, how did this happen?'];
		}
		const string = (type ? 'physical' : 'mental') + 'Effects';
		const success = await container.characters.updateOne(
			{ _id: new ObjectId(character._id) },
			{
				$set: {
					[string]: [...character[string], effect]
				}
			}
		);
		if (game.state.pass) {
			await container.game.updateOne({ channel: game.channel }, { $set: { 'state.pass': false } });
		}
		if (!success) {
			return [game, false, 'Effect not applied, how did this happen?'];
		}
		// Return the game
		game.state.pass = false;
		return [game, true, ''];
	}

	public async nameChange(game: Game, name: string, targetUser: string) {
		if (name == '') {
			return [game, false, 'Name is empty'];
		}
		// Find the player
		const player = Object.keys(game.players).find((player) => player === targetUser);
		if (!player) {
			return [game, false, 'Player not found, are you sure they are in the game?'];
		}
		// Apply the effect
		const character = await container.characters.findOne({ _id: new ObjectId(game.players[player].character) });
		if (!character) {
			return [game, false, 'Character not found, how did this happen?'];
		}
		const success = await container.characters.updateOne(
			{ id: game.players[player].character },
			{
				$set: {
					name: name
				}
			}
		);
		if (!success) {
			return [game, false, 'Name not changed, how did this happen?'];
		}
		if (game.state.pass) {
			await container.game.updateOne({ channel: game.channel }, { $set: { 'state.pass': false } });
		}
		game.state.pass = false;
		// Return the game
		return [game, true, ''];
	}

	public async avatarChange(game: Game, avatar: string, targetUser: string) {
		if (avatar == '') {
			return [game, false, 'Avatar is empty'];
		}
		// Find the player
		const player = Object.keys(game.players).find((player) => player === targetUser);
		if (!player) {
			return [game, false, 'Player not found, are you sure they are in the game?'];
		}
		// Apply the effect
		const character = await container.characters.findOne({ _id: new ObjectId(game.players[player].character) });		if (!character) {
			return [game, false, 'Character not found, how did this happen?'];
		}
		const success = await container.characters.updateOne(
			{ id: game.players[player].character },
			{
				$set: {
					avatar: avatar
				}
			}
		);
		if (!success) {
			return [game, false, 'Avatar not changed, how did this happen?'];
		}
		if (game.state.pass) {
			await container.game.updateOne({ channel: game.channel }, { $set: { 'state.pass': false } });
		}
		game.state.pass = false;
		// Return the game
		return [game, true, ''];
	}

	public async descriptionChange(game: Game, description: string, targetUser: string) {
		if (description == '') {
			return [game, false, 'Description is empty'];
		}
		// Find the player
		const player = Object.keys(game.players).find((player) => player === targetUser);
		if (!player) {
			return [game, false, 'Player not found, are you sure they are in the game?'];
		}
		// Apply the effect
		const character = await container.characters.findOne({ _id: new ObjectId(game.players[player].character) });
		if (!character) {
			return [game, false, 'Character not found, how did this happen?'];
		}
		const success = await container.characters.updateOne(
			{ id: game.players[player].character },
			{
				$set: {
					description: description
				}
			}
		);
		if (!success) {
			return [game, false, 'Description not changed, how did this happen?'];
		}
		if (game.state.pass) {
			await container.game.updateOne({ channel: game.channel }, { $set: { 'state.pass': false } });
		}
		game.state.pass = false;
		// Return the game
		return [game, true, ''];
	}

	public async bodySwap(game: Game, targetUser: string, swapTarget: string) {
		// Find the player
		const player = Object.keys(game.players).find((player) => player === targetUser);
		const player2 = Object.keys(game.players).find((player) => player === swapTarget);
		if (!player || !player2) {
			return [game, false, 'Player not found, are you sure they are in the game?'];
		}
		// Apply the effect
		const character = await container.characters.findOne({ _id: new ObjectId(game.players[player].character) });
		const character2 = await container.characters.findOne({ _id: new ObjectId(game.players[player2].character) });		if (!character || !character2) {
			return [game, false, 'Character not found, how did this happen?'];
		}
		const success = await container.characters.updateOne(
			{ id: game.players[player].character },
			{
				$set: {
					bodySwapped: true,
					bodySwapId: game.players[player2].character
				}
			}
		);
		const success2 = await container.characters.updateOne(
			{ id: game.players[player2].character },
			{
				$set: {
					bodySwapped: true,
					bodySwapId: game.players[player].character
				}
			}
		);
		if (!success || !success2) {
			return [game, false, 'Body swap not applied, how did this happen?'];
		}
		if (game.state.pass) {
			await container.game.updateOne({ channel: game.channel }, { $set: { 'state.pass': false } });
		}
		game.state.pass = false;
		// Return the game
		return [game, true, ''];
	}

	/**
	 * Later functions include:
	 *  - Name Change
	 *  - Body Swap
	 *  - Transform
	 *  - Mind Break
	 *  - Mind Control
	 *
	 */
}
