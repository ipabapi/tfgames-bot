import { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';
import { initialGame } from '../../lib/initials';
import { Deck, Game, GameMode } from '../../lib/bot.types';
import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { ComponentType } from 'discord.js';
const modes: { [key: string]: GameMode } = {
	normal: GameMode.NORMAL,
	hardcore: GameMode.HARDCORE
};

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
						.addStringOption((option) => option.setName('game').setDescription('Normal or Hardcore?').setRequired(true))
				)
				.addSubcommand((builder) => builder.setName('end').setDescription('End the game'))
				.addSubcommand((builder) => builder.setName('kick').setDescription('Kick a player from the game'))
		);
	}

	public async join(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		const game = await container.mongoClient.db('test').collection('game').findOne({ channel: interaction.channel?.id });
		if (!game) {
			return interaction.reply('There is no active game in this channel! Try using `/game start` instead.');
		}
		const user = await container.mongoClient.db('test').collection('users').findOne({ userId: interaction.user.id });
		if (!user) {
			return interaction.reply('You have not accepted our Terms of Service yet. Please do so by using `/setup`.');
		}
		if (game.players[interaction.user.id]) {
			return interaction.reply('You are already in the game!');
		}
		if (user.characters.length < 1) {
			return interaction.reply('You have not created any characters yet. Please do so by using `/character create`.');
		}
		const userDecks = await container.mongoClient
			.db('test')
			.collection('deck')
			.find({ player: '' + interaction.user.id })
			.toArray();
		if (userDecks.length < 1) {
			return interaction.reply('You have not created any decks yet. Please do so by using `/deck create`.');
		}
		// @ts-ignore
		this.choosePlayerAndDeck({ interaction, gameInit: game, userDecks });
		return interaction.reply('Sent you a DM to choose your character and deck!');
	}

	public async leave(interaction: Subcommand.ChatInputCommandInteraction) {
		// Leave the game
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		const game = await container.mongoClient.db('test').collection('game').findOne({ channel: interaction.channel?.id });
		if (!game) {
			return interaction.reply('There is no active game in this channel! Try using `/game start` instead.');
		}
		if (!game.players[interaction.user.id]) {
			return interaction.reply('You are not in the game!');
		}
		game.players = Object.fromEntries(Object.entries(game.players).filter(([key, _value]) => key != interaction.user.id));
		if (Object.keys(game.players).length < 1) {
			await container.mongoClient.db('test').collection('game').deleteOne({ channel: interaction.channel?.id });
			return interaction.reply('You have left the game! The game has ended.');
		} else {
			await container.mongoClient
				.db('test')
				.collection('game')
				.updateOne({ channel: interaction.channel?.id }, { $set: { players: game.players } });
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
		// Check if the game is normal or hardcore
		const gameType = interaction.options.getString('game');
		if (gameType?.toLowerCase() != 'normal' && gameType?.toLowerCase() != 'hardcore') {
			return interaction.reply('Invalid game type! Please choose normal or hardcore.');
		}
		// Check if user has setup and characters
		const user = await container.mongoClient.db('test').collection('users').findOne({ userId: interaction.user.id });
		const userDecks = await this.container.mongoClient
			.db('test')
			.collection('deck')
			.find({ player: '' + interaction.user.id })
			.toArray();
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
		const game = await container.mongoClient.db('test').collection('game').findOne({ channel: interaction.channel.id });
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
		gameInit.gameMode = modes[gameType.toLowerCase()] || GameMode.NORMAL;

		// Add the game to the database

		const success = await container.mongoClient.db('test').collection('game').insertOne(gameInit);

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
		// End the game
		return interaction.reply('The game has ended!');
	}

	public async kick(interaction: Subcommand.ChatInputCommandInteraction) {
		// Kick a player from the game
		return interaction.reply('You have kicked a player from the game!');
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

	public async choosePlayerAndDeck({ interaction, gameInit, userDecks }: choosePlayerAndDeckProps) {
		const userCharacters = await this.container.mongoClient.db('test').collection('characters').find({ creator: interaction.user.id }).toArray();
		console.log(userCharacters);
		const charas = userCharacters.map((character) => {
			return {
				label: character.name,
				value: character._id.toString()
			};
		});
		console.log(charas);
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
				collector.on('collect', async (interaction) => {
					if (interaction.customId == 'choosechara') {
						const character = userCharacters.find((character) => character._id.toString() == interaction.values[0]);
						if (!character) {
							return interaction.reply('Invalid character!');
						}
						// Add the character to the game
						await container.mongoClient
							.db('test')
							.collection('game')
							.updateOne(
								{ channel: gameInit.channel },
								{ $set: { players: { [interaction.user.id]: { character: character._id.toString(), deck: '' } } } }
							);
						return interaction.reply(
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
					} else if (interaction.customId == 'chooseDeck') {
						const deck = userDecks.find((deck) => deck._id?.toString() == interaction.values[0]);
						if (!deck) {
							return interaction.reply('Invalid deck!');
						}
						let characterID = await container.mongoClient.db('test').collection('game').findOne({ channel: gameInit.channel });
						if (!characterID) {
							return interaction.reply('Invalid interaction!');
						}
						characterID = characterID.players[interaction.user.id].character;

						await container.mongoClient
							.db('test')
							.collection('game')
							.updateOne(
								{ channel: gameInit.channel },
								{
									$set: {
										players: {
											...gameInit.players,
											[interaction.user.id]: {
												character: characterID,
												deck: deck._id?.toString()
											}
										}
									}
								}
							);
						return interaction.reply('You have chosen your character and deck!');
					} else {
						return interaction.reply('Invalid interaction!');
					}
				});
				collector.on('end', async (_collected, reason) => {
					if (reason == 'time') {
						interaction.reply('You took too long to choose a character!');
					}
				});
			});
	}
}
