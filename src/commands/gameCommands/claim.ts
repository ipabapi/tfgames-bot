import { Command } from '@sapphire/framework';
import { GameStatus } from '../../lib/bot.types';

export class ClaimCommand extends Command {
    public constructor(context: Command.Context) {
        super(context, {
            name: 'claim',
            description: 'Claim a user\'s Fail draw',

        });
    }

   public override async registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        return this.claimFail(interaction);
    }

    private async claimFail(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
        // Get game
        // @ts-ignore
        const game = await this.container.game.findOne({channel: interaction.channel?.id});
        if (!game) return interaction.reply('No game found in this channel!');
        if (game.state.status == GameStatus.WAITINGFORPLAYERS) return interaction.reply('Game has not started yet!');
        // @ts-ignore
        if (!Object.keys(game.players).includes(interaction.user.id)) return interaction.reply('You are not in the game!');
        //@ts-ignore
        if (GameStatus.TURNSTART == game.state.status) return interaction.reply('There is no fail to claim yet!');
        if (game.state.currentPlayer.userId == interaction.user.id) return interaction.reply('You cannot claim your own fail!');
        if (game.state.failClaim != null) return interaction.reply(`Fail has already been claimed by <@${game.state.failClaim}>`);
        // Check if the fail is the last card
        if (!game.state.lastCard?.effect.tags.includes('fail')) return interaction.reply('There is no fail to claim!');
        // Claim fail
        await this.container.game.updateOne({channel: interaction.channel?.id}, {
            $set: {
                'state.failClaim': interaction.user.id
            }
        });
        return interaction.reply({
            embeds: [{
                title: 'Fail Claimed',
                description: `<@${interaction.user.id}> has claimed the fail card! Now what will they do to <@${game.state.currentPlayer.userId}>?`,
            }]
        })
    }
}