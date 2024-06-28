import { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';

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
                    default: true,
                },
                {
                    name: 'leave',
                    messageRun: 'leave',
                    chatInputRun: 'leave',
                },
                {
                    name: 'start',
                    messageRun: 'start',
                    chatInputRun: 'start',
                },
                {
                    name: 'end',
                    messageRun: 'end',
                    chatInputRun: 'end',
                },
                {
                    name: 'kick',
                    messageRun: 'kick',
                    chatInputRun: 'kick',
                }
                
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
                .addSubcommand((builder) =>
                    builder
                        .setName('leave')
                        .setDescription('Leave the game')
                )
                .addSubcommand((builder) =>
                    builder
                        .setName('start')
                        .setDescription('Start the game')
                )
                .addSubcommand((builder) =>
                    builder
                        .setName('end')
                        .setDescription('End the game')
                )
                .addSubcommand((builder) =>
                    builder
                        .setName('kick')
                        .setDescription('Kick a player from the game')
                )
        );
    }

    public async join(interaction: Subcommand.ChatInputCommandInteraction) {
        // Join the game
        // @ts-ignore
        container.mongoClient.db('test').collection('game').insertOne({ player: interaction.member.id });
        return interaction.reply('You have joined the game!');

    }

    public async leave(interaction: Subcommand.ChatInputCommandInteraction) {
        // Leave the game
        // @ts-ignore
        container.mongoClient.db('test').collection('game').deleteOne({ player: interaction.member.id });
        return interaction.reply('You have left the game!');
    }

    public async start(interaction: Subcommand.ChatInputCommandInteraction) {
        // Start the game
        return interaction.reply('The game has started!');
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

