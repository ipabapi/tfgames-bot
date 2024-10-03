import { container } from '@sapphire/framework';
import { GameState, Game, GameStatus, Player, Card, CardType } from '../lib/bot.types';
import { ObjectId } from 'mongodb';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { MessageComponentInteraction, User, APIEmbed, ComponentType } from 'discord.js';
import { optionalProps} from '../commands/gameCommands/apply';
import { MessageBuilder } from '@sapphire/discord.js-utilities';

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
		if (Object.keys(game.stealsActive).length >	0 && game.stealsActive[game.turnOrder[0].userId]) {
				// If they are, advance the turn to the player who stole from them
				const nextPlayer = game.stealsActive[game.turnOrder[0].userId];
				delete game.stealsActive[game.turnOrder[0].userId];
				const player = game.turnOrder.find((player) => player.userId === nextPlayer);
				if (!player) {
					throw new Error('Player not found, how did this happen?');
				}
				game.currentPlayer = player;
				//@ts-ignore
				game.turnOrder.push(game.turnOrder.shift());
			
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
		const character = await container.characters.findOne({ _id: new ObjectId(game.players[player].character) });
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
		const character = await container.characters.findOne({ _id: new ObjectId(game.players[player].character) });
		if (!character) {
			return [game, false, 'Character not found, how did this happen?'];
		}
		const success = await container.characters.updateOne(
			{ _id: new ObjectId(character._id) },
			{
				$set: {
					avatar: avatar
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
			{ _id: new ObjectId(character._id) },
			{
				$set: {
					description: description
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
			{ _id: new ObjectId(game.players[player].character) },
			{
				$set: {
					bodySwapped: true,
					bodySwapId: game.players[player2].character
				}
			}
		);
		const success2 = await container.characters.updateOne(
			{ _id: new ObjectId(game.players[player2].character) },
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

	public async verifyRequest(interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, optionals?: optionalProps) {
		console.log(optionals)
        if (!interaction.replied) {
            await interaction.deferReply({ ephemeral: true })
        }
        const target = interaction instanceof MessageComponentInteraction ? optionals?.target : interaction.options.getUser('target')        
        const player = await container.users.findOne({ userId: interaction.user.id }) as unknown as Player
        if (!player) {
            await interaction.reply({ content: 'You have not accepted our Privacy Policy and Terms of Service yet. Please use `/setup`.', ephemeral: true })
            return [false, null, null]
        }
        const game = await container.game.findOne({ channel: interaction.channel?.id }) as unknown as Game
        if (!game) {
            await interaction.editReply({ content: 'This channel does not have a game associated with it'})
            return [false, null, null]
        }
        // check if the player is in the game
        if (!Object.keys(game.players).includes(interaction.user.id)) {
            await interaction.editReply({ content: 'You are not in the game associated with this channel'})
            return [false, null, null]
        }
        if (game.state.status !== GameStatus.WAITING) {
            await interaction.editReply({ content: 'We are not in a state to apply effects to a player'})
            return [false, null, null]
        }
        if (game.state.failClaim != null) {
            if (game.state.currentPlayer?.userId == interaction.user.id) {
                await interaction.editReply({ content: 'You can\'t apply any effects while under a fail!'})
                return [false, null, null]
            }
            if (game.state.failClaim != interaction.user.id) {
                await interaction.editReply({ content: 'You are not the user who claimed this fail!'})
                return [false, null, null]
            }
        if (game.state.currentPlayer?.userId != target?.id) {
            if (game.state.currentPlayer?.userId != target?.id) {
                await interaction.editReply({ content: 'You are applying to a failed user, please select them.'})
                return [false, null, null]
            }
        }
        } else if (game.state.currentPlayer?.userId != interaction.user.id && !optionals) {
            await interaction.editReply({ content: 'It is not your turn'})
            return [false, null, null]
        }
        return [true, player, game]
    }   

    public async checkEffect(card: Card, type: string) {
        if (card.effect.tags.includes('fail') || card.effect.tags.includes('luck')) {
            return true
        }
        if (card.type != CardType.TF) {
            return false
        }
        if (card.effect.tags.includes(type)) {
            return true
        }
        return false
    }

	// @ts-ignore
    public async waitForShieldOrReverse(game: Game, player: User, interaction: Subcommand.ChatInputCommandInteraction | MessageComponentInteraction, message: APIEmbed, type: string, effect: string, target2?: User) {
        // this will run after the player has applied the effect
        // check if the player has a shield active, and if target2 is not null, check if target2 has a shield active
        // @ts-ignore
        let applied = false;
        if (Object.keys(game.players[interaction.user.id]).includes('shieldActive') && game.players[interaction.user.id].shieldActive) {
            const newPlayers = game.players
            newPlayers[player.id].shieldActive = false
            await container.game.updateOne({ channel: interaction.channel?.id }, { $set: { 
                players: newPlayers
            } })
            await interaction.reply({ content: `<@${player.id}> has a shield active, the effect has been blocked as the shield crumbles away.`, ephemeral: true })
            return false
        }
        if (target2 && Object.keys(game.players[target2.id]).includes('shieldActive') && game.players[target2.id].shieldActive) {
            const newPlayers = game.players
            newPlayers[player.id].shieldActive = false
            await container.game.updateOne({ channel: interaction.channel?.id }, { $set: { 
                players: newPlayers
            } })
            await interaction.reply({ content: `<@${target2.id}> has a shield active, the effect has been blocked as the shield crumbles away.`, ephemeral: true })
            return false
        }
        // send the message to the channel, add the components to use the shield or reverse or do nothing
        return await interaction.channel?.send(new MessageBuilder().setEmbeds([message]).setComponents([
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 1,
                        customId: 'shield',
                        label: 'Shield',
                        emoji: { name: '🛡️' }
                    },
                    {
                        type: 2,
                        style: 1,
                        customId: 'reverse',
                        label: 'Reverse',
                        emoji: { name: '🔁' }
                    },
                    {
                        type: 2,
                        style: 1,
                        customId: 'nothing',
                        label: 'Nothing',
                        emoji: { name: '❌' }
                    },
                    {
                        type: 2,
                        style: 1,
                        customId: 'Veto',
                        label: 'Veto',
                        emoji: { name: '🚫' }
                    }
                ]
            }
        ])).then(async (msg) => {
            return new Promise(async(resolve, _reject) => {
                const filter = (i: any) => i.user.id === player.id || (target2 && i.user.id === target2.id) || false;
            const collector = msg.channel?.createMessageComponentCollector({ filter, time: 60000, componentType: ComponentType.Button })
            let typeEffect = 0 // 0 = nothing, 1 = shield, 2 = reverse
            let votes = 0;
            collector.on('collect', async (i) => {
                let result;
                if (!Object.keys(game.players).includes(i.user.id)) {
                    return await i.reply({ content: 'You are not in the game associated with this channel', ephemeral: true })
                }
                const user = await container.users.findOne({ userId: i.user.id }) as unknown as Player
                if (i.customId === 'shield') {
                    // remove shield from inventory
                    result = await container.InventoryManager.removeInventoryItem(user, interaction.guild?.id || '', '0001') //TODO: change logic
                    if (!result) {
                        await i.reply({ content: 'You do not have a shield to use', ephemeral: true })
                        return
                    }
                    await i.reply({content: `You used a shield, you have ${user.guilds[interaction.guild?.id || ''].inventory['0001'] - 1} shields left`, ephemeral: true}) //TODO: change logic
                    typeEffect = 1
                    collector.stop()
                    return
                } else if (i.customId === 'reverse') {
                    // remove reverse from inventory
                    result = await container.InventoryManager.removeInventoryItem(user, interaction.guild?.id || '', '0002') //TODO: change logic

                    if (!result) {
                        await i.reply({ content: 'You do not have a reverse to use', ephemeral: true })
                        return
                    }
                    // await i.reply({content: `You used a reverse, you have ${user.guilds[interaction.guild?.id || ''].inventory['0002'] - 1} reverses left`, ephemeral: true}) //TODO: change logic
                    typeEffect = 2
                    collector.stop()
                    const newOpt = {
                        user: user,
                        target: player,
                        target2: target2,
                        effect: effect,
                        verify: container.gl.verifyRequest,
                        check: container.gl.checkEffect,
                        waitForShieldOrReverse: container.gl.waitForShieldOrReverse
                    }
					// call the correct type from the Apply class
                    // @ts-ignore 
                    const reverseResult = container.effectTypes[type]
				
                    const reversedResult = await reverseResult(i, newOpt)
					if (reversedResult) {
						await interaction.channel?.send({ content: 'The effect has been reversed.'})
					}
                    return
                } else if (i.customId === 'nothing') {
                    applied = true
                    await i.reply({ content: 'You have chosen to do nothing', ephemeral: true })
                    collector.stop()
                    return
                } else if (i.customId === 'Veto') {
                    votes++
                    await i.reply({ content: 'You have chosen to veto the effect', ephemeral: true })
                    if (votes >= Object.keys(game.players).length/2) {
                        await interaction.channel?.send('The players have chosen to veto the effect, it has not been applied.')
                        collector.stop()
                        return
                    }
                    return
                }
                return

            })
            collector.on('end', async (_collected, reason) => {
                if (reason === 'time') {
                    applied = true
                    await interaction.channel?.send('The player did not respond in time, the effect has been applied.')
                }
                if (typeEffect != 0) { 
                    
                    if (typeEffect === 1) {
                        // shield
						msg.edit({components: []})
                        await interaction.channel?.send({ content: `<@${player.id}> has used a shield to block the effect.`})
                        return
                    } else if (typeEffect === 2) {
                        // reverse
						msg.edit({components: []})
                        await interaction.channel?.send({ content: `<@${player.id}> has used a reverse to reverse the effect.`})
                        return
                    }
                }
                msg.delete()
                resolve(applied)
            })
        })
        }).then((result) => {
            return result
        })
        
    }
}
