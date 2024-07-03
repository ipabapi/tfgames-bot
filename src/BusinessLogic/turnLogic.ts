import { container } from '@sapphire/framework';
import { GameState, Game, GameStatus, Player } from '../lib/bot.types';

export class GameLogic {
    constructor() {

    }

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
        // Advance the turn
        game.currentPlayer = game.turnOrder.shift() || null;
        if (!game.currentPlayer) {
            throw new Error('Current player is undefined, how did this happen?');
        }
        game.turnOrder.push(game.currentPlayer);
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
    public async addPlayer(game: GameState, user: Player) {
        // insert player before last index of turn order
        game.turnOrder.splice(game.turnOrder.length - 1, 0, user)
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
        const character = await container.characters.findOne({ id: game.players[player].character });
        if (!character) {
            return [game, false, 'Character not found, how did this happen?'];
        }
        const string = (type ? 'physical' : 'mental') + 'Effects';
        const success = await container.characters.updateOne({ id: game.players[player].character }, {
            $set: {
                [string]: [...character[string], effect]
            }
        })
        if (!success) {
            return [game, false, 'Effect not applied, how did this happen?'];
        }
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