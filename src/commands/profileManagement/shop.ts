import { Subcommand } from "@sapphire/plugin-subcommands";
import {recieveItem, showInventory} from "../../BusinessLogic/shopBusinessLogic";
import {MessageBuilder} from "@sapphire/discord.js-utilities";
import {InteractionResponse} from "discord.js";

export class Shop extends Subcommand {
  constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: "shop",
      description: "Shop command",
      subcommands: [
        {
            'name': 'buy',
            'messageRun': 'buy',
            'chatInputRun': 'buy',
            default: true
        },
        {
            'name': 'sell',
            'messageRun': 'sell',
            'chatInputRun': 'sell'
        },
        {
            'name': 'inventory',
            'messageRun': 'inventory',
            'chatInputRun': 'inventory'
        }
      ]
    });

  }

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) => 
      builder
        .setName('shop')
        .setDescription('The shop set of commands!')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('buy')
            .setDescription('Buy an item from the shop!')
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('sell')
            .setDescription('Sell an item to the shop!')
            .addStringOption((option) =>
                option
                    .setName('item')
                    .setDescription('The item you want to sell!')
                    .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('inventory')
            .setDescription('Check your inventory!')
        )
    );
  }

    public async buy(interaction: Subcommand.ChatInputCommandInteraction) {
      let user = interaction.user.id
        interaction.reply(new MessageBuilder()
            .setEmbeds([
                {
                    title: 'Cool shop',
                    color: 0,
                    description: 'The following items are able to be purchased:\n- Shield - 20 gold\n- Reverse - 15 Gold',
                    footer: {
                        text: `test`
                    }
                }
            ])
            .setComponents([
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            label: 'Shield',
                            custom_id: 'shield'
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Reverse',
                            custom_id: 'reverse'
                        }
                    ]
                }
            ])
    )
    .then(
        async (msg: InteractionResponse) => {
            const collector = msg.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === user,
                time: 300000
            });
            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'shield') {
                        await interaction.reply('Shield has been bought');
                        await recieveItem(user,"card_0010")
                } else if (interaction.customId === 'reverse') {
                    await interaction.reply('Reverse has been bought')
                    await recieveItem(user,"card_0011")
                } else {
                    await interaction.editReply('How did you do that?')
                }
            });
            collector.on('end', async () => {
                    await interaction.reply('Interaction has timed out')
            });
        }
        );
    }
    public async sell(interaction: Subcommand.ChatInputCommandInteraction) {
        const item = interaction.options.getString('item', true);
        await interaction.reply(`You sold ${item}!`);
    }

    public async inventory(interaction: Subcommand.ChatInputCommandInteraction) {
        let itemString = `# Inventory for ${interaction.user.tag}\n`
        itemString += await showInventory(interaction.user.id)
        interaction.reply({content: itemString, ephemeral: true});
    }
}