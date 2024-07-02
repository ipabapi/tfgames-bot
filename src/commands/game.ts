// @ts-nocheck
import { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';
import { initialGame, initialGameState } from '../lib/initials';
import { GameMode } from '../lib/bot.types';
const modes = {
	normal: GameMode.NORMAL,
	hardcore: GameMode.HARDCORE
};

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
		// Join the game
		// @ts-ignore
		container.mongoClient.db('test').collection('game').insertOne({ player: interaction.member.id });
		
		// check if player is registered
		var result = await container.mongoClient.db('test').collection('users').findOne({userId: interaction.member.id})
		
		if (result == null){
			return interaction.reply('You have not yet registered. Unable to join game!');
		} else {
			return interaction.reply('You have joined the game!');
		}
		
		
	}

	public async leave(interaction: Subcommand.ChatInputCommandInteraction) {
		// Leave the game
		// @ts-ignore
		container.mongoClient.db('test').collection('game').deleteOne({ player: interaction.member.id });
		return interaction.reply('You have left the game!');
	}

	public async start(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
		// Check if the game is normal or hardcore
		const gameType = interaction.options.getString('game')
		if (gameType?.toLowerCase() != 'normal' && gameType?.toLowerCase() != 'hardcore') {
			return interaction.reply('Invalid game type! Please choose normal or hardcore.');
		}
		// Check if user has setup and characters
		// @ts-ignore
		const user = await container.mongoClient.db('test').collection('users').findOne({ userId: interaction.member.id });
		const userDecks = await this.container.mongoClient.db('test').collection('deck').find({ player: "" + interaction.member.id}).toArray();
		console.log(interaction.member.id, userDecks)
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
		if (interaction.channel.isThread()) {
			gameInit.channel = interaction.channel.parentId;
			gameInit.inThread = true;
			gameInit.threadId = interaction.channel.id;
		} else {
			gameInit.channel = interaction.channel.id;
		}
		gameInit.gameMode = modes[gameType.toLowerCase()];

		// Add the game to the database

		const success = await container.mongoClient.db('test').collection('game').insertOne(gameInit);

		if (!success) {
			return interaction.reply('There was an error starting the game!');
		}

		interaction.reply('The game has started!');

		const userCharacters = await this.container.mongoClient
			.db('test')
			.collection('characters')
			.find({ creator: interaction.member.id })
			.toArray();
		interaction.author
			.send(
				new MessageBuilder()
					.setEmbeds([
						{
							title: 'Choose a character',
							description: `You have ${user.characters.length} characters. Please choose one to play with:\n${userCharacters.map((character, index) => `${index + 1}. ${character.name}`).join('\n')}`
						}
					])
					.setComponents({
						type: 1,
						components: [
							{
								type: 3,
								customId: 'chooseCharacter',
								options: userCharacters.map((character, index) => {
									return {
										label: character.name,
										value: character._id.toString()
									};
								})
							}
						]
					})
			)
			.then((m) => {
				const collector = m.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });
				collector.on('collect', async (interaction) => {
					const character = userCharacters.find((character) => character._id.toString() == interaction.values[0]);
					if (!character) {
						return interaction.reply('Invalid character!');
					}
					// Add the character to the game
					// @ts-ignore
					container.mongoClient
						.db('test')
						.collection('game')
						.updateOne(
							{ channel: gameInit.channel },
							{ $push: { players: { player: interaction.member.id, character: character._id.toString() } } }
						);
					interaction
						.reply(
							new MessageBuilder()
								.setEmbeds([
									{
										title: 'Choose Deck',
										description: 'Please choose a deck to play with.'
									}
								])
								.setComponents({
									type: 1,
									components: [
										{
											type: 3,
											customId: 'chooseDeck',
											options: userDecks.map((deck, index) => {
												return {
													label: deck.name,
													value: deck._id.toString()
												};
											})
										}
									]
								})
						)
						.then((m) => {
							const deckCollector = m.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });
							deckCollector.on('collect', async (interaction) => {
								const deck = userDecks.find((deck) => deck._id.toString() == interaction.values[0]);
								if (!deck) {
									return interaction.reply('Invalid deck!');
								}
								// Add the deck to the game
								// @ts-ignore
								container.mongoClient
									.db('test')
									.collection('game')
									.updateOne(
										{ channel: gameInit.channel },
										{
											$set: {
												players: {
													player: interaction.member.id,
													character: character._id.toString(),
													deck: deck._id.toString()
												}
											}
										}
									);
								interaction.reply('You have chosen your character and deck!');
							});
							deckCollector.on('end', async (collected, reason) => {
								if (reason == 'time') {
									interaction.reply('You took too long to choose a deck!');
								}
							});
						});
				});
				collector.on('end', async (collected, reason) => {
					if (reason == 'time') {
						interaction.reply('You took too long to choose a character!');
					}
				});
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
}
