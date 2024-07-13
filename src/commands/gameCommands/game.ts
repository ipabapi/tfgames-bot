import { Subcommand } from '@sapphire/plugin-subcommands';
import { CommandOptionsRunTypeEnum, container } from '@sapphire/framework';
import { initialGame } from '../../lib/initials';
import { GameMode, GameStatus } from '../../lib/bot.types';
import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { voteHandler } from '../../lib/handlers/voteManager';

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

				},
			]
		});
	}

	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((builder) =>
					builder
						.setName('join')
						.setDescription('Join the game')
				)
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
		const game = interaction.userData?.game;
		if (!game) {
			return interaction.reply('You are not in a game!'); 
		}
		if (game.players[interaction.user.id]) {
			return interaction.reply('You are already in the game!'); 
		}
		const player = interaction.userData?.player;
		if (!player) {
			return interaction.reply('You have not accepted our Terms of Service yet. Please do so by using `/setup`.');
		}
		const addFunc = async () => {
			this.container.GameManager.choosePlayerAndDeck(interaction);
			this.container.gl.addPlayer(game.state, player, interaction.channelId);
		}
		const embed = {
			embeds: [
				{
					title: `${interaction.user.globalName} is asking to join the game!`,
					description: `Please vote by clicking yes or no below. If the majority votes yes, you will be added to the game.`,
					thumbnails: [
						{
							url: interaction.user.displayAvatarURL()
						}
					]
				}
			]
		}

		return voteHandler(interaction, embed, addFunc, []);
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
		const game = interaction.userData?.game;
		if (!game) {
			return interaction.reply('You are not in a game!'); 
		}
		const delFunc = async () => {
			await this.container.game.deleteOne({ channel: interaction.channel?.id });
			return interaction.editReply({
				embeds: [
					{
						title: 'The game has ended!',
						description: 'The game has been ended by a majority vote.'
					}
				]
			})
		}
		const embed = {
			embeds: [
				{
					title: `${interaction.user.globalName} is voting to end the game!`,
					description: `Please vote by clicking yes or no below. If the majority votes yes, the game will end.`
				}
			]
		}
		//@ts-ignore
		return voteHandler(interaction, embed, delFunc, []);
		
		
	}

	public async kick(interaction: Subcommand.ChatInputCommandInteraction) {
		const game = interaction.userData?.game;
		if (!game) {
			return interaction.reply('You are not in a game!'); 
		}
		const user = interaction.options.getUser('player');
		if (!user) {
			return interaction.reply('You must specify a player to kick!');
		}
		if (user.id == interaction.user.id) {
			return interaction.reply('You cannot kick yourself from the game!');
		}
		const delFunc = async () => {
			this.removePlayer(interaction);
		}
		const embed = {
			embeds: [
				{
					title: `A vote has been started to kick ${user.username} from the game!`,
					description: `Please vote by clicking yes or no below. If the majority votes yes, the player will be kicked from the game.`
				}
			]
		}
		//@ts-ignore
		return voteHandler(interaction, embed, delFunc, [user.id]);
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

	public async removePlayer(interaction: Subcommand.ChatInputCommandInteraction) {
		// Remove a player from the game
		const game =  interaction.userData?.game;
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
			if (newState.state.status != GameStatus.WAITINGFORPLAYERS) {

			if (game.state.currentPlayer?.userId != newState.state.currentPlayer?.userId) {
				interaction.channel?.send(
					`It is now <@${newState.state.currentPlayer?.userId}>'s turn, as <@${game.state.currentPlayer?.userId}> has been kicked from the game.`
				);
			}
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

	
}
