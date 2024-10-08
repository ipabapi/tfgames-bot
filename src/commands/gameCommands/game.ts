import { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';
import { initialGame } from '../../lib/initials';
import { Deck, Game, GameMode, GameStatus, Player } from '../../lib/bot.types';
import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { ComponentType, PermissionFlagsBits } from 'discord.js';
// const modes: { [key: string]: GameMode } = {
// 	normal: GameMode.NORMAL,
// 	hardcore: GameMode.HARDCORE
// };

interface choosePlayerAndDeckProps {
	interaction: Subcommand.ChatInputCommandInteraction;
	gameInit: Game;
	userDecks: Deck[];
}

/**
 * This is the game command, which is a subcommand container.
 * This will contain the join, leave, start, end, and kick subcommands.
 * This will also be used to check for the length of time since the last message in the game's channel.
 * If the time is greater than 10 minutes, the game will be paused.
 */

export class GameCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options = {}) {
		super(context, {
			...options,
			name: 'game',
			aliases: ['g'],
			description: 'The game command, used to manage games.',
			subcommands: [
				{
					name: 'join',
					messageRun: 'join',
					chatInputRun: 'join',
					default: true
				},
				{
					name: 'leave',
					messageRun: 'leave',
					chatInputRun: 'leave'
				},
				{
					name: 'start',
					messageRun: 'start',
					chatInputRun: 'start'
				},
				{
					name: 'edit',
					messageRun: 'edit',
					chatInputRun: 'edit'
				},
				{
					name: 'end',
					messageRun: 'end',
					chatInputRun: 'end'
				},
				{
					name: 'kick',
					messageRun: 'kick',
					chatInputRun: 'kick'
				},
				{
					name: 'status',
					messageRun: 'status',
					chatInputRun: 'status'
				}
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((builder) => builder.setName('join').setDescription('Join the game'))
				.addSubcommand((builder) => builder.setName('leave').setDescription('Leave the game'))
				.addSubcommand((builder) =>
					builder
						.setName('start')
						.setDescription('Start the game')
						// .addStringOption((option) => option.setName('game').setDescription('Normal or Hardcore?').setRequired(true))
				)
				.addSubcommand((builder) => builder.setName('end').setDescription('End the game'))
				.addSubcommand((builder) =>
					builder
						.setName('kick')
						.setDescription('Kick a player from the game')
						.addUserOption((option) => option.setName('player').setDescription('The player to kick').setRequired(true))
				)
				.addSubcommand((builder) =>
					builder
						.setName('status')
						.setDescription('Check the game status')
						.addChannelOption((option) => option.setName('channel').setDescription('The channel to check').setRequired(false))
				)
		);
	}

	public async join(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		const game = await container.game.findOne({ channel: interaction.channel?.id });
		if (!game) {
			return interaction.reply('There is no active game in this channel! Try using `/game start` instead.');
		}
		const user = await container.users.findOne({ userId: interaction.user.id });
		if (!user) {
			return interaction.reply('You have not accepted our Terms of Service yet. Please do so by using `/setup`.');
		}
		if (game.players[interaction.user.id]) {
			return interaction.reply('You are already in the game!');
		}
		if (user.characters.length < 1) {
			return interaction.reply('You have not created any characters yet. Please do so by using `/character create`.');
		}
		const userDecks = await container.deck.find({ player: '' + interaction.user.id }).toArray();
		if (userDecks.length < 1) {
			return interaction.reply('You have not created any decks yet. Please do so by using `/deck create`.');
		}
		if (game.state.status != GameStatus.WAITINGFORPLAYERS) {
			// interaction.deferReply({ ephemeral: true });
			const result = await this.joinVote(interaction);
			if (result) {
				// @ts-ignore
				this.choosePlayerAndDeck({ interaction, gameInit: game, userDecks });
				this.container.gl.addPlayer(game.state, await container.users.findOne({ userId: interaction.user.id }) as unknown as Player || {}, interaction.channel?.id || '');
				return interaction.reply('Sent you a DM to choose your character and deck!');
			} else {
				return interaction.reply('The vote to join the game failed!');
			}
		}
		// @ts-ignore
		this.choosePlayerAndDeck({ interaction, gameInit: game, userDecks });
		return interaction.reply('Sent you a DM to choose your character and deck!');
	}

	public async leave(interaction: Subcommand.ChatInputCommandInteraction) {
		// Leave the game
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		const game = await container.game.findOne({ channel: interaction.channel?.id });
		if (!game) {
			return interaction.reply('There is no active game in this channel! Try using `/game start` instead.');
		}
		if (!game.players[interaction.user.id]) {
			return interaction.reply('You are not in the game!');
		}
		game.players = Object.fromEntries(Object.entries(game.players).filter(([key, _value]) => key != interaction.user.id));
		if (Object.keys(game.players).length < 1) {
			await container.game.deleteOne({ channel: interaction.channel?.id });
			return interaction.reply('You have left the game! The game has ended.');
		} else {
			//@ts-ignore
			const newState = await container.gl.removePlayer(game, interaction.user.id);
			await container.game.updateOne({ channel: interaction.channel?.id }, { $set: { players: game.players, state: newState.state } });
			if (game.state.currentPlayer.userId != newState.state.currentPlayer?.userId) {
				interaction.channel?.send(
					`It is now <@${newState.state.currentPlayer?.userId}>'s turn, as <@${game.state.currentPlayer.userId}> has left the game.`
				);
			}
			return interaction.reply(
				new MessageBuilder().setEmbeds([
					{
						title: `${interaction.user.displayName} has left the game!`,
						description: `There are now ${Object.keys(game.players).length} players in the game.\n${Object.keys(game.players)
							.map((player) => `<@${player}>`)
							.join('\n')}`
					}
				])
			);
		}
	}

	public async start(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		// // Check if the game is normal or hardcore
		// const gameType = interaction.options.getString('game');
		// if (gameType?.toLowerCase() != 'normal' && gameType?.toLowerCase() != 'hardcore') {
		// 	return interaction.reply('Invalid game type! Please choose normal or hardcore.');
		// }
		console.log('starting game');
		// Check if user has setup and characters
		const user = await container.users.findOne({ userId: interaction.user.id });
		const userDecks = await this.container.deck.find({ player: '' + interaction.user.id }).toArray();
		if (!user) {
			return interaction.reply('You have not accepted our Terms of Service yet. Please do so by using `/setup`.');
		}
		if (user.characters.length < 1) {
			return interaction.reply('You have not created any characters yet. Please do so by using `/character create`.');
		}
		if (userDecks.length < 1) {
			return interaction.reply('You have not created any decks yet. Please do so by using `/deck create`.');
		}
		// Check if this channel is already an active game
		// @ts-ignore
		const game = await container.game.findOne({ channel: interaction.channel.id });
		if (game) {
			return interaction.reply('This channel is already an active game! Try using `/game join` instead.');
		}
		// Start the game
		const gameInit = initialGame;
		// Check if we're in a thread
		if (interaction.channel?.isThread()) {
			gameInit.channel = interaction.channel.parentId || '';
			gameInit.inThread = true;
			gameInit.threadId = interaction.channel.id;
		} else {
			gameInit.channel = interaction.channel?.id || '';
		}
		// gameInit.gameMode = modes[gameType.toLowerCase()] || GameMode.NORMAL;
		gameInit.gameMode = GameMode.NORMAL;

		// Add the game to the database

		const success = await container.game.insertOne(gameInit);

		if (!success) {
			return interaction.reply('There was an error starting the game!');
		}

		console.log('starting user characters');

		console.log('goinh into choosePlayerAndDeck');
		//TODO: Fix typing
		// @ts-ignore
		this.choosePlayerAndDeck({ interaction, gameInit: initialGame, userDecks });
		return interaction.reply({
			content:
				'The game has started! Check your DMs to choose your character and deck. Other players will be able to join the game by using `/game join`.'
		});
	}

	public async end(interaction: Subcommand.ChatInputCommandInteraction) {
		// Check if the command is being used in a server
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		// Check if the game exists
		const game = await container.game.findOne({ channel: interaction.channel?.id });
		if (!game) {
			return interaction.reply('There is no active game in this channel! Try using `/game start` instead.');
		}
		if (!game.players[interaction.user.id]) {
			return interaction.reply('You are not in the game!');
		}
		// Ask for confirmation
		const players = Object.keys(game.players);
		interaction.channel
			?.send(
				new MessageBuilder()
					.setEmbeds([
						{
							title: `${interaction.user.displayName} is voting to end the game!`,
							description: `Please vote by clicking yes or no below. If the majority votes yes, the game will end.`
						}
					])
					.setComponents([
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									customId: 'endgame',
									label: 'Yes'
								},
								{
									type: 2,
									style: 4,
									customId: 'dontendgame',
									label: 'No'
								}
							]
						}
					])
			)
			.then(async (m) => {
				const collector = m.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
				let votes = 0;
				let endVotes = 0;
				let dontEndVotes = 0;
				let voted: string[] = [];
				collector.on('collect', async (i) => {
					try {
						if (voted.includes(i.user.id)) {
							return i.reply({ content: 'You have already voted!', ephemeral: true });
						}
						if (players.includes(i.user.id)) {
							if (i.customId == 'endgame') {
								endVotes++;
								votes++;
								voted.push(i.user.id);
							} else if (i.customId == 'dontendgame') {
								dontEndVotes++;
								votes++;
								voted.push(i.user.id);
							}
							if (votes >= players.length) {
								if (endVotes > dontEndVotes) {
									await container.game.deleteOne({ channel: i.channel?.id });
									m.edit('The game has ended!');
									collector.stop();
									return;
								} else {
									m.edit('The game has not ended!');
									collector.stop();
									return;
								}
							}
							return i.reply({ content: 'You have voted!', ephemeral: true });
						}
						return i.reply(`<@${i.user.id}>, you are not in the game!`);
					} catch (e) {
						console.error(e);
						return i.channel?.send('An error occurred while processing your vote. Please try again.');
					}
				});
				collector.on('end', async (_collected, reason) => {
					if (reason == 'time') {
						// Check the votes
						if (endVotes > dontEndVotes) {
							await container.game.deleteOne({ channel: interaction.channel?.id });
							return m.edit('The game has ended!');
						} else {
							return m.edit('The game has not ended!');
						}
					}
					return;
				});
			});
		return interaction.reply({ content: 'You have initiated a vote to end the game!', ephemeral: true });
	}

	public async kick(interaction: Subcommand.ChatInputCommandInteraction) {
		// check if the command is being used in a server
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		// check if the game exists
		const game = await container.game.findOne({ channel: interaction.channel?.id });
		if (!game) {
			return interaction.reply('There is no active game in this channel! Try using `/game start` instead.');
		}

		// check if the user has permission to kick, can be used immediately by moderators, otherwise needs a vote
		if (interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
			this.removePlayer(interaction);
			return interaction.reply({
				content: 'Since you have the permission to kick members, the player has been kicked from the game without a vote.',
				ephemeral: true
			});
		}
		// check if the user is in the game
		if (!game.players[interaction.user.id]) {
			return interaction.reply('You are not in the game!');
		}
		// start a vote to kick the player
		const players = Object.keys(game.players);
		interaction.channel
			?.send(
				new MessageBuilder()
					.setEmbeds([
						{
							title: `${interaction.user.displayName} is voting to kick <@${interaction.options.getUser('player')?.id || ''}>!`,
							description: `Please vote by clicking yes or no below. If the majority votes yes, the player will be kicked.`
						}
					])
					.setComponents([
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 1,
									customId: 'kickplayer',
									label: 'Yes'
								},
								{
									type: 2,
									style: 4,
									customId: 'dontkickplayer',
									label: 'No'
								}
							]
						}
					])
			)
			.then(async (m) => {
				const collector = m.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
				let votes = 0;
				let kickVotes = 0;
				let dontKickVotes = 0;
				let voted: string[] = [];
				collector.on('collect', async (i) => {
					if (players.includes(i.user.id) && !voted.includes(i.user.id)) {
						if (i.customId == 'kickplayer') {
							kickVotes++;
							votes++;
							voted.push(i.user.id);
						} else if (i.customId == 'dontkickplayer') {
							dontKickVotes++;
							votes++;
							voted.push(i.user.id);
						}
						if (votes >= players.length) {
							if (kickVotes > dontKickVotes) {
								this.removePlayer(interaction);
								return m.channel.send('The player has been kicked!');
							} else {
								return m.channel.send('The player has not been kicked!');
							}
						}
						return i.reply({ content: 'You have voted!', ephemeral: true });
					}
					return i.reply(`<@${i.user.id}>, you are not in the game!`);
				});
				collector.on('end', async (_collected, reason) => {
					if (reason == 'time') {
						// Check the votes
						if (kickVotes > dontKickVotes) {
							this.removePlayer(interaction);
							return m.channel.send('The player has been kicked!');
						} else {
							return m.channel.send('The player has not been kicked!');
						}
					}
					return;
				});
			});
		return interaction.reply('In progress');
	}

	public async status(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel') || interaction.channel;
		// check if channel referenced is somehow outside of the server or not visible to the bot
		if (!channel || interaction.guild?.channels.cache.get(channel.id) == undefined) {
			return interaction.reply({ content: 'Invalid channel, is it outside of the server or maybe one I cannot see?', ephemeral: true });
		}
		const game = await container.game.findOne({ channel: channel.id });
		if (!game) {
			return interaction.reply('There is no active game in this channel!');
		}
		const players = Object.keys(game.players);
		// TODO: Add more information to the status
		return interaction.reply(
			new MessageBuilder().setEmbeds([
				{
					title: 'Game Status',
					description: `There are ${players.length} players in the game.\n${players.map((player) => `<@${player}>`).join('\n')}`
				}
			])
		);
	}

	public async pauseGame() {
		// Pause the game
	}

	public async resumeGame() {
		// Resume the game
	}

	public async checkTimeSinceLastMessage() {
		// Check the time since the last message in the game's channel
	}

	public async checkPlayers() {
		// Check the players in the game
	}

	public async checkGameStatus() {
		// Check the game's status
	}

	public async removePlayer(interaction: Subcommand.ChatInputCommandInteraction) {
		// Remove a player from the game
		const game = await container.game.findOne({ channel: interaction.channel?.id });
		if (!game) {
			console.error('Game not found, but vote passed? Did the game end before the vote was completed?');
			interaction.channel?.send(
				'Hmm, something went wrong when trying to kick the player. Please try again, if the issue persists, contact the bot owner.'
			);
			return;
		}
		game.players = Object.fromEntries(Object.entries(game.players).filter(([key, _value]) => key != interaction.options.getUser('player')?.id));
		if (Object.keys(game.players).length < 1) {
			await container.game.deleteOne({ channel: interaction.channel?.id });
			return interaction.reply('The player has been kicked! The game has ended.');
		} else {
			//@ts-ignore
			const newState = await container.gl.removePlayer(game, interaction.options.getUser('player')?.id);

			await container.game.updateOne({ channel: interaction.channel?.id }, { $set: { players: game.players } });

			if (game.state.currentPlayer.userId != newState.state.currentPlayer?.userId) {
				interaction.channel?.send(
					`It is now <@${newState.state.currentPlayer?.userId}>'s turn, as <@${game.state.currentPlayer.userId}> has been kicked from the game.`
				);
			}
			return interaction.channel?.send(
				new MessageBuilder().setEmbeds([
					{
						title: `${interaction.options.getUser('player')?.username} has been kicked from the game!`,
						description: `There are now ${Object.keys(game.players).length} players in the game.\n${Object.keys(game.players)
							.map((player) => `<@${player}>`)
							.join('\n')}`
					}
				])
			);
		}
	}

	public async choosePlayerAndDeck({ interaction, gameInit, userDecks }: choosePlayerAndDeckProps) {
		const userCharacters = await this.container.characters.find({ creator: interaction.user.id }).toArray();
		console.log(userCharacters);
		const charas = userCharacters.map((character) => {
			return {
				label: character.name,
				value: character._id.toString()
			};
		});
		interaction.user
			.send(
				new MessageBuilder()
					.setEmbeds([
						{
							title: 'Choose a character',
							description: `You have ${userCharacters.length} characters. Please choose one to play with:\n${userCharacters.map((character, index) => `${index + 1}. ${character.name}`).join('\n')}`,
							color: 0x00ff00
						}
					])
					.setComponents([
						{
							type: 1,
							components: [
								{
									type: 3,
									customId: 'choosechara',
									options: charas
								}
							]
						}
					])
			)
			.then(async (m) => {
				const collector = m.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });
				let characterID = '';
				collector.on('collect', async (i) => {
					if (i.customId == 'choosechara') {
						const character = userCharacters.find((character) => character._id.toString() == i.values[0]);
						if (!character) {
							return i.reply('Invalid character!');
						}
						characterID = character._id.toString();
						return i.reply(
							new MessageBuilder()
								.setEmbeds([
									{
										title: 'Choose Deck',
										description: 'Please choose a deck to play with.'
									}
								])
								.setComponents([
									{
										type: 1,
										components: [
											{
												type: 3,
												customId: 'chooseDeck',
												options: userDecks.map((deck) => {
													return {
														label: deck.name,
														value: deck._id?.toString() || ''
													};
												})
											}
										]
									}
								])
						);
					} else if (i.customId == 'chooseDeck') {
						const deck = userDecks.find((deck) => deck._id?.toString() == i.values[0]);
						if (!deck) {
							return i.reply('Invalid deck!');
						}

						await container.game.updateOne(
							{ channel: gameInit.channel },
							{
								$set: {
									players: {
										...gameInit.players,
										[i.user.id]: {
											character: characterID,
											deck: deck._id?.toString()
										}
									}
								}
							}
						);
						i.reply('You have chosen your character and deck!');
						collector.stop();
						return;
					} else {
						return i.reply('Invalid interaction!');
					}
				});
				collector.on('end', async (_collected, reason) => {
					if (reason == 'time') {
						m.channel.send('You took too long to choose a character!');
					}
				});
			});
	}

	public async joinVote(interaction: Subcommand.ChatInputCommandInteraction) {
		return new Promise(async (resolve, reject) => {
			const game = await container.game.findOne({ channel: interaction.channel?.id });
			if (!game) {
				return reject('Game not found');
			}
			console.log(game);
			//@ts-ignore
			const players = Object.keys(game.players);
			interaction.channel
				?.send(
					new MessageBuilder()
						.setEmbeds([
							{
								title: `${interaction.user.displayName} is voting to join the game!`,
								description: `Please vote by clicking yes or no below. If the majority votes yes, the player will join the game.`
							}
						])
						.setComponents([
							{
								type: 1,
								components: [
									{
										type: 2,
										style: 1,
										customId: 'joingame',
										label: 'Yes'
									},
									{
										type: 2,
										style: 4,
										customId: 'dontjoingame',
										label: 'No'
									}
								]
							}
						])
				)
				.then(async (m) => {
					const collector = m.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
					let votes = 0;
					let joinVotes = 0;
					let dontJoinVotes = 0;
					let voted: string[] = [];
					collector.on('collect', async (i) => {
						try {
							if (voted.includes(i.user.id)) {
								return await i.reply({ content: 'You have already voted!', ephemeral: true });
							}
							if (players.includes(i.user.id)) {
								if (i.customId == 'joingame') {
									joinVotes++;
									votes++;
									voted.push(i.user.id);
								} else if (i.customId == 'dontjoingame') {
									dontJoinVotes++;
									votes++;
									voted.push(i.user.id);
								}
								if (votes >= players.length) {
									console.log('is it this crashing');
									await i.reply({ content: 'You have voted!', ephemeral: true });
									collector.stop();
									return
								}
								console.log('or maybe this');
								return await i.reply({ content: 'You have voted!', ephemeral: true });
							}
							return i.channel?.send(`<@${i.user.id}>, you are not in the game!`);
						} catch (e) {
							console.error(e);
							return i.channel?.send(
								'An error occurred while processing your vote. This MAY mean it got counted, but please try again.'
							);
						}
					});
					collector.on('end', async (_collected) => {
							// Check the votes
							if (joinVotes > dontJoinVotes) {
								await m.channel.send(`<@${interaction.user.id}> has joined the game!`);
								await m.delete();
								return resolve(true);
							}
							return resolve(false);
						
					});
				});
		});
	}
}
