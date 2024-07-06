import { Command } from "@sapphire/framework";
import { showInventory } from "../../BusinessLogic/shopBusinessLogic";
import { MessageBuilder } from "@sapphire/discord.js-utilities";
import { items } from "../../lib/items";

export class InventoryCommand extends Command {
    public constructor(context: Command.LoaderContext) {
        super(context, {
            name: 'inventory',
            description: 'Show your inventory',
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
        return this.inventory(interaction)
    }

    public async inventory(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.guild) return interaction.reply('This command can only be used in a server!');
        const user = interaction.user.id;
        const guildId = interaction.guild.id;
        const [inventory, gold] = await showInventory(user, guildId)
            return interaction.reply(new MessageBuilder()
            .setEmbeds([
                {
                    title: `Inventory for ${interaction.user.username}`,
                    color: 0, // @ts-ignore
                    description: Object.keys(inventory).map((key) => `${items[key].name}: ${inventory[key]}`).join('\n') + '\n**Gold:** ' + gold,
                    footer: {
                        text: `Requested at ${new Date().toLocaleString()}`
                }
            }
            ]))
}
}