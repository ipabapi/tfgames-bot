import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';


export class AdvanceCommand extends Command {
    public constructor(context: Command.Context) {
        super(context, {
            description: 'Advance the game to the next turn',
            
        });
    }

    public override async registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName('advance')
                .setDescription('Advance the game to the next turn')
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.guild) return interaction.reply('This command can only be used in a server');
        const game = await this.container.game.findOne({channel: interaction.channel?.id});
        if (!game) return interaction.reply('There is no game in this channel');
        if (game.state.currentPlayer.userId !== interaction.user.id) return interaction.reply('It is not your turn, so you cannot advance the game.');
        const newGameState = await this.container.gl.advanceTurn(game.state);
        if (!newGameState) return interaction.reply('There was an error advancing the game');
        if (!newGameState.currentPlayer) return interaction.reply('The game has an issue, please inform the developers.');
        await this.container.game.updateOne({channel: interaction.channel?.id}, {$set: {state: newGameState}});
        console.log(newGameState.currentPlayer)
        const nextPlayer = interaction.guild.members.cache.get(newGameState.currentPlayer.userId);
        console.log(nextPlayer)
        return interaction.reply(new MessageBuilder()
            .setContent(`<@${nextPlayer?.id}>`)
            .setEmbeds([{
                title: `${interaction.user.displayName} has advanced the game to the next turn`,
                description: `It is now ${nextPlayer?.displayName}'s turn`,
                footer: {
                    text: `Updated at: <t:${Math.floor(Date.now() / 1000)}:f>`
                }
            }])
        );
    }
}