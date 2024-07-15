import { MessageBuilder } from "@sapphire/discord.js-utilities";
import { Command, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import { GameStatus } from "../../lib/bot.types";
import { addGold } from "../../BusinessLogic/shopBusinessLogic";


export class PassCommand extends Command {
    public constructor(context: Command.LoaderContext) {
        super(context, {
            name: 'pass',
            description: 'Pass your turn',
            enabled: true,
            runIn: CommandOptionsRunTypeEnum.GuildAny,
            preconditions: ['NoActiveGame']
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
        if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
        // Get game
        const game = await this.container.game.findOne({channel: interaction.channel?.id});
        if (!game) return interaction.reply('No game found in this channel!');
        if (game.state.status == GameStatus.WAITINGFORPLAYERS) return interaction.reply('Game has not started yet!');
        if (!Object.keys(game.players).includes(interaction.user.id)) return interaction.reply('You are not in the game!');
        if (game.state.currentPlayer !== interaction.user.id) return interaction.reply('It is not your turn!');
        if (game.state.lastCard) {
            if (game.state.lastCard?.effect.tags.includes('fail')) return interaction.reply('You cannot pass your turn after drawing a fail card!');
        }
        if (!game.state.pass) return interaction.reply('You cannot pass your turn! Please draw a card or advance the game.');
        // Pass turn
        const newGameState = await this.container.gl.advanceTurn(game.state);
        if (!newGameState) return interaction.reply('There was an error passing the turn');
        if (!newGameState.currentPlayer) return interaction.reply('The game has an issue, please inform the developers.');
        // Add 5 gold to the player
        await addGold(interaction.user.id, 5, interaction.guild.id);
        // Update game
        await this.container.game.updateOne({channel: interaction.channel?.id}, {
            $set: {
                state: newGameState
            }
        });
        const nextPlayer = newGameState.currentPlayer
        return interaction.reply(new MessageBuilder()
            .setContent(`<@${nextPlayer}>`)
            .setEmbeds([{
                title: `${interaction.user.displayName} has passed their turn`,
                description: `It is now <@${nextPlayer}>'s turn`,
                footer: {
                    text: `Updated at: <t:${Math.floor(Date.now() / 1000)}:f>`
                }
            }])
        );
    }
}