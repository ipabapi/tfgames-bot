import { Subcommand } from '@sapphire/plugin-subcommands';

// Extend `Subcommand` instead of `Command`
export class UserCommand extends Subcommand {
    public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: 'game',
            subcommands: [
                {
                    name: 'create',
                    chatInputRun: 'createGame'
                },
                {
                    name: 'join',
                    chatInputRun: 'joinGame'
                },
                {
                    name: 'start',
                    chatInputRun: 'startGame'
                }
            ]
        });
    }

    registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('game')
                .setDescription('Game command') // Needed even though base command isn't displayed to end user
                .addSubcommand((command) => command.setName('create').setDescription('Creates new game'))
                .addSubcommand((command) =>
                    command
                        .setName('join')
                        .setDescription('Adds Player to game')
                        .addUserOption((option) =>
                            option.setName('user').setDescription('user to add to game').setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName('start')
                        .setDescription('starts a game')
                )
        );
    }

    public async createGame(interaction: Subcommand.ChatInputCommandInteraction) {
       await interaction.reply({ content: `Game has been created!`, ephemeral: true, fetchReply: true });

    }

    public async joinGame(interaction: Subcommand.ChatInputCommandInteraction) {
        const user = interaction.options.getUser('user', true);
        await interaction.reply({ content: `User ${user} joined the game`, ephemeral: true, fetchReply: true });

    }

    public async startGame(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply({ content: `Game has been started!`, ephemeral: true, fetchReply: true });
    }
}