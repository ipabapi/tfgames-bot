import { Command, container } from '@sapphire/framework';
import { Game, GameStatus } from '../../lib/bot.types';
import { gameSetup } from '../../BusinessLogic/gameSetup';

export class BeginGameCommand extends Command {
    public constructor(context: Command.Context) {
        super(context, {
            name: 'begingame',
            description: 'Begin a game once all players have joined',
            enabled: true,
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
        // Check if user is in a server
        if (!interaction.guild) { return interaction.reply('This command can only be used in servers'); }

        // Check if there is a game in this channel
        const game = await container.game.findOne({ channel: interaction.channel?.id });
        if (!game) { return interaction.reply('There is no game in this channel'); }
        if (game.state.status != GameStatus.WAITINGFORPLAYERS) { return interaction.reply('The game has already started'); }

        // Check if all players have set up their characters and decks, which are at game.players.character and game.players.deck respectively, game.players is an object with the player's id as the key
        const ready = Object.keys(game.players).every((player) => game.players[player].character && game.players[player].deck);              
        if (!ready) { return interaction.reply('Not all players have finished setting up their characters'); }
        console.log(ready);

        // Update game status
        // Start Game Setup
        return gameSetup(interaction, game as Game);
    }

}