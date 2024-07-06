import { MessageBuilder } from "@sapphire/discord.js-utilities";
import { Subcommand } from "@sapphire/plugin-subcommands";

export class Help extends Subcommand {
  constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: "help",
      description: "Help command",
    });
  }

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) => 
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((subcommand) =>
            subcommand
                .setName('setup')
                .setDescription('Setup the bot')
            )

    );
  }

  public async help(interaction: Subcommand.ChatInputCommandInteraction) {
    return interaction.reply(new MessageBuilder()
    .setEmbeds([
        {
            title: 'Help',
            color: 0,
            description: 'This bot is a work in progress. Please be patient with us as we work to make it better!',
            footer: {
                text: `Requested at ${new Date().toLocaleString()}`
        }
    }
    ]))
  }

    public async setup(interaction: Subcommand.ChatInputCommandInteraction) {
        return interaction.reply(new MessageBuilder()
        .setEmbeds([
            {
                title: 'Setup',
                color: 0,
                description: 'This bot is a work in progress. Please be patient with us as we work to make it better!',
                footer: {
                    text: `Requested at ${new Date().toLocaleString()}`
            }
        }
        ]))
    }
}