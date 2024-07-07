import { Command } from "@sapphire/framework";
import { Game, GameStatus, Player } from "../../lib/bot.types";
import { items } from "../../lib/items";

export class UseItemCommand extends Command {
    public constructor(context: Command.LoaderContext) {
        super(context, {
            name: 'useItem',
            description: 'Use an item from your inventory',
            enabled: true,
        });
    }

    public override async registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) => 
        builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName('item')
                    .setDescription('The item you want to use!')
                    .setRequired(true)
                )
            .addUserOption((option) =>
                option
                    .setName('user')
                    .setDescription('The user you want to use the item on!')
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        return this.useItem(interaction)
    }

    private errorMessages = {
        'ITEM_NOT_FOUND': 'Item not found!',
        'ITEM_NOT_IN_INV': 'Item not in inventory!',
        'NOT_ENOUGH_ITEM': 'Not enough of this item!',
        'TYPE_ERROR': 'Unknown error! Please contact the developer!',
        'SHIELD_ACTIVE': 'You already have a shield active!',
        'STEAL_ACTIVE': 'This player already has a steal waiting!',
        'EXTRA_TURN_ACTIVE': 'You already have an extra turn active!'
    } as {[key: string]: string}

    private async useItem(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
        if (!interaction.options.getString('item')) return interaction.reply('Please provide an item to use!');
        // check if user is in game
        const game = await this.container.game.findOne({channel: interaction.channel?.id}) as unknown as Game;
        if (!game) return interaction.reply('No game found in this channel!');
        if (!Object.keys(game.players).includes(interaction.user.id)) return interaction.reply('You are not in the game!');
        // check if it is the user's turn
        if (game.state.currentPlayer?.userId !== interaction.user.id) return interaction.reply('It is not your turn!');
        // check if it is the right game state
        if (![GameStatus.TURNSTART, GameStatus.WAITING, GameStatus.TURNEND].includes(game.state.status)) return interaction.reply('You can only use items during your turn!');
        // search for item in items:
        const itemID = Object.keys(items).find((item) => items[item].name.toLowerCase().replaceAll(' ', '') === interaction.options.getString('item')?.toLowerCase().replaceAll(' ', '')) || '';
        const player = await this.container.users.findOne({userId: interaction.user.id}) as unknown as Player;
        console.log(itemID, player)
        const target = interaction.options.getUser('user')?.id || interaction.user.id;
        const [successful, code, _newGame] = await this.container.InventoryManager.useItem(player, interaction.guild.id, itemID, game, target);
        if (!successful) return interaction.reply(this.errorMessages[code]);
        return interaction.reply(`${items[itemID].name} used successfully!`);        
    }
}