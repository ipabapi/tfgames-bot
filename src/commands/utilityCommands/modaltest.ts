import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";


export class ModalTestCommand extends Command {
    public constructor(context: Command.LoaderContext) {
        super(context, {
            name: 'modaltest',
            description: 'Test modals',
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

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        await interaction.reply({ embeds: [
            {
                title: 'Test',
                description: 'This is a test',
                color: 0x00ff00
            }
        ],
        components: [{
            type: 1,
            components: [
                {
                type: 2,
                style: 1,
                label: 'Create Character',
                customId: 'create-character',
                }
            ]
        }],
        ephemeral: true
        })
    }
}