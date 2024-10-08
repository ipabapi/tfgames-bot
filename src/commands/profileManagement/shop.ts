import { Subcommand } from "@sapphire/plugin-subcommands";
import {recieveItem} from "../../BusinessLogic/shopBusinessLogic";
import {MessageBuilder} from "@sapphire/discord.js-utilities";
import {ComponentType, InteractionResponse} from "discord.js";
import { items } from "../../lib/items";

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
    );
  }

    public async buy(interaction: Subcommand.ChatInputCommandInteraction) {
      let user = interaction.user.id
      // @ts-ignore
        const itemList = Object.keys(items).map((item) => ({label: items[item].name, value: item}));
        interaction.reply(new MessageBuilder()
            .setEmbeds([
                {
                    title: 'Cool shop',
                    color: 0,
                    // @ts-ignore
                    description: `These items are available for purchase!\n\n${Object.keys(items).map((item) => `${items[item].name}: ${items[item].price} gold`).join('\n')}`,
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
                            type: 3,
                            custom_id: 'choose',
                            options: itemList,
                        }
                    ]
                }
            ])
    )
    .then(
        async (msg: InteractionResponse) => {
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                filter: (int) => int.user.id === user,
                time: 300000
            });
            collector.on('collect', async (i) => {
                const item = i.values[0];
                // @ts-ignore
                const [success, error] = await recieveItem(user, item, i.guild.id, true);
                if (success) {
                    await i.reply(`You have purchased ${item}!`);
                    collector.stop()
                    return
                } else {
                    console.log(error)
                    await i.reply(`${error == "GOLD_NOT_ENOUGH" ? "You don't have enough gold!" : "Item not found!"}`);
                    collector.stop()
                    return
                }
            });
            collector.on('end', async () => {
                msg.delete();
            });
        }
        );
    }
    public async sell(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply('This command is not implemented yet');
    }

   
}