import { Subcommand } from '@sapphire/plugin-subcommands';
import { CommandOptionsRunTypeEnum, container } from '@sapphire/framework';
import { initialGame } from '../../lib/initials';
import { GameMode } from '../../lib/bot.types';
import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { ComponentType, PermissionFlagsBits } from 'discord.js';

export class GameCommand extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options = {}) {
		super(context, {
			...options,
			name: 'game',
			aliases: ['g'],
			description: 'The game command, used to manage games.',
			runIn: [CommandOptionsRunTypeEnum.GuildAny],
			subcommands: [
				{
					name: 'join',
					messageRun: 'join',
					chatInputRun: 'join',
					preconditions: ['WaitingForPlayers'],
					default: true
				},
				{
					name: 'leave',
					messageRun: 'leave',
					chatInputRun: 'leave',
					preconditions: ['GameActive']
				},
				{
					name: 'start',
					messageRun: 'start',
					chatInputRun: 'start',
					preconditions: ['CompletedSetup', 'HasCharacter', 'HasDecks', 'NoActiveGame' ]
				},
				{
					name: 'end',
					messageRun: 'end',
					chatInputRun: 'end',
					preconditions: ['GameActive', 'IsPlayer']
				},
				{
					name: 'kick',
					messageRun: 'kick',
					chatInputRun: 'kick',
					preconditions: ['GameActive', 'IsPlayer']
				},
				{
					name: 'status',
					messageRun: 'status',
					chatInputRun: 'status',
					preconditions: ['GameActive'],
					default: true
				},
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
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
		return interaction.reply('In progress');
	}

	public async leave(interaction: Subcommand.ChatInputCommandInteraction) {
		const game = interaction.userData?.game;
		if (!game) {
			return interaction.reply('You are not in a game!'); 
		}
		game.players = Object.fromEntries(Object.entries(game.players).filter(([key, _value]) => key != interaction.user.id));
		if (Object.keys(game.players).length < 1) {
			await container.game.deleteOne({ channel: interaction.channel?.id });
			return interaction.reply('You have left the game! The game has ended.');
		} else {
			const newState = await container.gl.removePlayer(game, interaction.user.id);
			await container.game.updateOne({ channel: interaction.channel?.id }, { $set: { players: game.players, state: newState.state } });
			if (game.state.currentPlayer?.userId != newState.state.currentPlayer?.userId) {
				interaction.channel?.send(
					`It is now <@${newState.state.currentPlayer?.userId}>'s turn, as <@${game.state.currentPlayer?.userId}> has left the game.`
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

	public async start(interaction: Subcommand.ChatInputCommandInteraction) {
		console.log('Starting game');
		const user = interaction.userData?.player;
		// const userDecks = await this.container.deck.find({ player: '' + interaction.user.id }).toArray() as unknown as Deck[];
		if (!user) {
			return interaction.reply('You have not accepted our Terms of Service yet. Please do so by using `/setup`.');
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
		gameInit.gameMode = GameMode.NORMAL;

		const success = await container.game.insertOne(gameInit);

		if (!success) {
			return interaction.reply('There was an error starting the game!');
		}
				
		const startSuccess= await this.container.GameManager.choosePlayerAndDeck(interaction);
		if (!startSuccess) {
			await container.game.deleteOne({ channel: interaction.channel?.id });
			return interaction.replied ? interaction.editReply('The game has been cancelled.') : interaction.reply('The game has been cancelled.');
		}
		return;
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
