import { Command } from "@sapphire/framework";
import { ActionRowBuilder, ChatInputCommandInteraction, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder } from "discord.js";


export class ModalTestCommand extends Command {
    public constructor(context: Command.LoaderContext) {
        super(context, {
            name: 'modaltest',
            description: 'Test modals',
            enabled: false,
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
        // Create a modal
        const modal = new ModalBuilder()
            .setTitle('Modal Test')
            .setCustomId('modal-test')
          
        const test = new TextInputBuilder()
            .setCustomId('test')
            .setLabel('Test')
            .setPlaceholder('Test')
            .setRequired(true);
        const actionRowOne = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(test);
        modal.addComponents(actionRowOne);
        return await interaction.showModal(modal);
    }
}