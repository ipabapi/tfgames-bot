import { MessageBuilder } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import {Card, CardRarity, CardType, GameStatus} from '../../lib/bot.types';
import {addGold, recieveItem} from "../../BusinessLogic/shopBusinessLogic";

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
        console.log('draw', interaction.user.displayName)
        if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
        // Get game
        // @ts-ignore
        const game = await this.container.game.findOne({channel: interaction.channel?.id});
        if (!game) return interaction.reply('No game found in this channel!');
        if (game.state.status == GameStatus.WAITINGFORPLAYERS) return interaction.reply('Game has not started yet!');
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
        
        // parse Card effects
            this.parseCard(card, interaction.user.id, interaction.guild.id)
        // Reply
        return interaction.reply(new MessageBuilder()
        .setEmbeds([{
            title: `${card.name} Drawn!`,
            description: `You drew a ${card.rarity} card, called ${card.name}!${card.type == CardType.ITEM ? ' It has been added to your inventory!' : ''}`,
            image: {
                url: card.image || '',
            },
            fields: [
                {name: 'Description', value: card.description},
                {name: 'Effect', value: card.effect.action},
                 {name: 'Single Target?', value: card.effect.singleTarget ? 'Yes' : 'No'},
            ],
            color: rarityColors[card.rarity],
            footer: {
                text: `Drawn by ${interaction.user.username}`
            }

        }]));
        


    }
    
    private async parseCard(card: Card, userId: string, guildId: string){
        switch (card.type){
            case CardType.ITEM:
                await this.addItemToInventory(card.effect.action, userId, guildId)
                break
            case CardType.GOLD:
                await this.addGold(parseInt(card.effect.action),userId, guildId)
        }
    }
    
    private async addItemToInventory(stringId: string, userId: string, guildId: string){
       await recieveItem(userId, stringId, guildId, false)
    }
    private async addGold(amount: number, userId: string, guildId: string){
        await addGold(userId,amount, guildId)
    }
}