import { Subcommand } from "@sapphire/plugin-subcommands";

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
            .addStringOption((option) =>
                option
                    .setName('item')
                    .setDescription('The item you want to buy!')
                    .setRequired(true)
                )
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
        const item = interaction.options.getString('item', true);
        await interaction.reply(`You bought ${item}!`);
    }

    public async sell(interaction: Subcommand.ChatInputCommandInteraction) {
        const item = interaction.options.getString('item', true);
        await interaction.reply(`You sold ${item}!`);
    }

    public async inventory(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply('You have 10 apples!');
    }
}