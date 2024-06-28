import { Subcommand } from "@sapphire/plugin-subcommands";
// import { container } from "@sapphire/framework";


export class CharacterCommand extends Subcommand {
    public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options = {}) {
        super(context, {
            ...options,
            name: "character",
            aliases: ["char"],
            description: "Get information about a character",
            subcommands: [
                {
                    name: "info",
                    messageRun: 'info',
                    chatInputRun: 'info',
                    default: true,
                },
                {
                    name: "edit",
                    messageRun: 'edit',
                    chatInputRun: 'edit',
                },
                {
                    name: "create",
                    messageRun: 'create',
                    chatInputRun: 'create',
                },
                {
                    name: "delete",
                    messageRun: 'delete',
                    chatInputRun: 'delete',
                },
                {
                    name: "list",
                    messageRun: 'list',
                    chatInputRun: 'list',
                },
                {
                    name: "help",
                    messageRun: 'help',
                    chatInputRun: 'help'
                }
            ]
        });
    }

    public override registerApplicationCommands(registry: Subcommand.Registry) {
        console.log(this.name, this.description)
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((builder) =>
                    builder
                        .setName("info")
                        .setDescription("Get information about a character")
                        .addStringOption((option) =>
                            option
                                .setName("name")
                                .setDescription("The name of the character")
                                .setRequired(true)
                        ).addUserOption((option) =>
                            option
                                .setName("user")
                                .setDescription("The user to get the character from, if none is given, it defaults to the author.")
                                .setRequired(false)
                        )
                        
                )
                .addSubcommand((builder) =>
                    builder
                        .setName("edit")
                        .setDescription("Edit your character, or a collared character of yours.")
                        .addStringOption((option) =>
                            option
                                .setName("name")
                                .setDescription("The name of the character")
                                .setRequired(true)
                        ).addUserOption((option) =>
                            option
                                .setName("user")
                                .setDescription("If you want to edit a collared character, you can specify the user here.")
                                .setRequired(false)
                        )
                        
                )
                .addSubcommand((builder) =>
                    builder
                        .setName("create")
                        .setDescription("Create a character, this will start a DM conversation with you to fill out the character sheet!")
                )
                .addSubcommand((builder) =>
                    builder
                        .setName("delete")
                        .setDescription("Delete a character")
                        .addStringOption((option) =>
                            option
                                .setName("name")
                                .setDescription("The name of the character")
                                .setRequired(true)
                        )
                )
                .addSubcommand((builder) =>
                    builder
                        .setName("list")
                        .setDescription("List all characters")
                        .addUserOption((option) =>
                            option
                                .setName("user")
                                .setDescription("The user to get the characters from, if none is given, it defaults to the author.")
                                .setRequired(false)
                        )
                )
        );
    }

    public async info(interaction: Subcommand.ChatInputCommandInteraction) {
        
        await interaction.reply("info");
    }

    public async edit(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply("edit");
    }

    public async create(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply("create");
    }

    public async delete(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply("delete");
    }

    public async list(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply("list");

    }

    public async help(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply("help");
    }
}