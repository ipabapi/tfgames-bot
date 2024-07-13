import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { GameStatus } from '../../lib/bot.types';
import { gameSetup } from '../../BusinessLogic/gameSetup';

export class BeginGameCommand extends Command {
    public constructor(context: Command.LoaderContext) {
        super(context, {
            name: 'begingame',
            description: 'Begin a game once all players have joined',
            enabled: true,
            runIn: [CommandOptionsRunTypeEnum.GuildAny],
            preconditions: ['GameActive', 'IsPlayer'],
        });
    }

    public override async registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) => 
        builder
            .setName(this.name)
            .setDescription(this.description)
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        return this.beginGame(interaction)
    }

    private async beginGame(interaction: Command.ChatInputCommandInteraction) {
        const game = interaction.userData?.game;
        if (!game) { return interaction.reply('There is no game in this channel'); }
        if (game.state.status != GameStatus.WAITINGFORPLAYERS) { return interaction.reply('The game has already started'); }

        const ready = Object.keys(game.players).every((player) => game.players[player].character && game.players[player].deck);              
        if (!ready) { return interaction.reply('Not all players have finished setting up their characters'); }
        return gameSetup(interaction);
    }

}