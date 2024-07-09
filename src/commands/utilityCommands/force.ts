import { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";
import { PermissionFlagsBits } from "discord.js";
import { MessageBuilder } from "@sapphire/discord.js-utilities";
import { addGold, removeGold } from "../../BusinessLogic/shopBusinessLogic";
import { Player } from "../../lib/bot.types";
import { items } from "../../lib/items";




export class Force extends Subcommand {
    constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: "force",
            description: "Force command",
            subcommands: [
                {
                    'name': 'changegold',
                    'messageRun': 'changegold',
                    'chatInputRun': 'changegold',
                    default: true
                },
                {
                    'name': 'changeitem',
                    'messageRun': 'changeitem',
                    'chatInputRun': 'changeitem'
                },
                {
                    'name': 'advance',
                    'messageRun': 'advance',
                    'chatInputRun': 'advance'
                },
                {
                    'name': 'end',
                    'messageRun': 'end',
                    'chatInputRun': 'end'
                }
            ]
        });

    }

    public override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('force')
                .setDescription('Admin and bot owner only commands!')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('changegold')
                        .setDescription('Change the gold of a player!')
                        .addUserOption((option) =>
                            option
                                .setName('player')
                                .setDescription('The player you want to change the gold of!')
                                .setRequired(true)
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('amount')
                                .setDescription('The amount of gold you want to change!')
                                .setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('changeitem')
                        .setDescription('Change the item of a player!')
                        .addUserOption((option) =>
                            option
                                .setName('player')
                                .setDescription('The player you want to change the item of!')
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('item')
                                .setDescription('The item you want to change!')
                                .setRequired(true)
                        )
                        .addNumberOption((option) =>
                            option
                                .setName('amount')
                                .setDescription('The amount of the item you want to change!')
                                .setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('advance')
                        .setDescription('Advance the game!')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('end')
                        .setDescription('End the game!')
                )
        );
    }

    public async preVerify(interaction: Subcommand.ChatInputCommandInteraction) {
        if (!interaction.guild) return [false, 'This command can only be used in a server!'];
        if (interaction.user.id == this.container.ownerId) return [true, ''];
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) return [false, 'You do not have permission to use this command!'];
        return [true, ''];
    }

    public async changegold(interaction: Subcommand.ChatInputCommandInteraction) {
        const [check, msg] = await this.preVerify(interaction);
        // @ts-ignore FIX
        if (!check) return await interaction.reply(msg);
        const user = interaction.options.getUser('player');
        const amount = interaction.options.getInteger('amount');
        if (!user || !amount) return await interaction.reply('Invalid user or amount!');
        console.log(user, amount, check, msg)
        // if amount is negative, remove gold
        if (amount < 0) {
            // @ts-ignore FIX
            await removeGold(user.id, amount, interaction.guild.id)
        } else {
            // @ts-ignore FIX
            await addGold(user.id, amount, interaction.guild.id)
        }
        return await interaction.reply(`Changed gold of ${user.username} by ${amount}!`);
    }

    public async changeitem(interaction: Subcommand.ChatInputCommandInteraction) {
        const [check, msg] = await this.preVerify(interaction);
        // @ts-ignore FIX
        if (!check) return interaction.reply(msg);
        const user = interaction.options.getUser('player');
        const item = interaction.options.getString('item');
        const amount = interaction.options.getNumber('amount');
        if (!user || !item || !amount) return interaction.reply('Invalid user, item or amount!');
        const player = await container.users.findOne({ userId: user.id }) as unknown as Player;
        if (!player) return interaction.reply('User not found! Have they done `/setup`?');
        const itemID = Object.keys(items).find((item) => items[item].name.toLowerCase().replaceAll(' ', '') === interaction.options.getString('item')?.toLowerCase().replaceAll(' ', '')) || '';
        if (!itemID) return interaction.reply('Item not found!');
        // if amount is negative, remove item
        if (amount < 0) {
            // @ts-ignore FIX
            await container.InventoryManager.removeInventoryItem(player, interaction.guild.id, itemID, Math.abs(amount));
        } else {
            // @ts-ignore FIX
            await container.InventoryManager.addInventoryItem(player, interaction.guild.id, itemID, amount);
        }
        const pos = amount > 0;
        const sing = Math.abs(amount) != 1;
        return interaction.reply(`${pos ? 'Added' : 'Removed'} ${amount} ${items[itemID].name}${sing ? 's' : ''} ${pos ? 'to' : 'from'} <@${user.id}>'s inventory!`);
    }

    public async advance(interaction: Subcommand.ChatInputCommandInteraction) {
        const [check, msg] = await this.preVerify(interaction);
        // @ts-ignore FIX
        if (!check) return interaction.reply(msg);
        const game = await this.container.game.findOne({ channel: interaction.channel?.id });
        if (!game) return interaction.reply('There is no game in this channel!');
        const newGameState = await this.container.gl.advanceTurn(game.state);
        if (!newGameState) return interaction.reply('There was an error advancing the game!');
        if (!newGameState.currentPlayer) return interaction.reply('The game has an issue, please inform the developers!');
        await this.container.game.updateOne({ channel: interaction.channel?.id }, { $set: { state: newGameState } });
        const nextPlayer = newGameState.currentPlayer.userId;
        return interaction.reply(
            new MessageBuilder()
            .setContent(`<@${nextPlayer}>`)
            .setEmbeds([{
                title: `${interaction.user.username} has advanced the game to the next turn via force command!`,
                description: `It is now <@${nextPlayer}>'s turn`,
                footer: {
                    text: `Updated at: <t:${Math.floor(Date.now() / 1000)}:f>`
                }}]
        )
        );

    }

    public async end(interaction: Subcommand.ChatInputCommandInteraction) {
        const [check, msg] = await this.preVerify(interaction);
        // @ts-ignore FIX
        if (!check) return interaction.reply(msg);
        const game = await this.container.game.findOne({ channel: interaction.channel?.id });
        if (!game) return interaction.reply('There is no game in this channel!');
        await this.container.game.deleteOne({ channel: interaction.channel?.id });
        return interaction.reply(`<@${interaction.user.id}> has ended the game via force command!`);
    }
}