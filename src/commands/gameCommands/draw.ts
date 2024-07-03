import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { CardRarity, GameStatus } from '../../lib/bot.types';

export const rarityColors = {
    [CardRarity.COMMON]: 0xFFFFFF,
    [CardRarity.UNCOMMON]: 0x00FF00,
    [CardRarity.RARE]: 0x0000FF,
    [CardRarity.EPIC]: 0xFF00FF,
    [CardRarity.LEGENDARY]: 0xFFFF00,
}

export class DrawCommand extends Command {
    public constructor(context: Command.Context) {
        super(context, {
            name: 'draw', 
            description: 'Draw a card from the deck',
            enabled: true,
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
        console.log('draw')
        if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
        // Get game
        // @ts-ignore
        const game = await this.container.game.findOne({channel: interaction.channel?.id});
        if (!game) return interaction.reply('No game found in this channel!');
        // @ts-ignore
        if (!Object.keys(game.players).includes(interaction.user.id)) return interaction.reply('You are not in the game!');
        //@ts-ignore
        if (game.state.currentPlayer.userId !== interaction.user.id) return interaction.reply('It is not your turn!');
        if (game.state.status != GameStatus.TURNSTART) return interaction.reply('You\'ve already drawn a card this turn!');
        // Draw card
        // @ts-ignore
        const newGameState = await this.container.gl.drawCard(game.state);
        // Update game
        // @ts-ignore
        await this.container.game.updateOne({channel: interaction.channel?.id}, {
            $set: {
                state: newGameState
            }
        });
        const card = newGameState.lastCard 
        if (!card) return interaction.reply('No card drawn! This should not happen!');
        

        // Reply
        return interaction.reply(new MessageBuilder()
        .setEmbeds([{
            title: `${card.name} Drawn!`,
            description: `You drew a ${card.rarity} card, called ${card.name}!`,
            image: {
                url: card.image || '',
            },
            fields: [
                {name: 'Description', value: card.description},
                {name: 'Effect', value: card.effect.action},
                 {name: 'Single Target?', value: card.effect.singleTarget ? 'Yes' : 'No'},
            ],
            color: rarityColors[card.rarity],

        }]));
        


    }
}