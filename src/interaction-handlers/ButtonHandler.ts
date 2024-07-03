// @ts-nocheck
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';

export class ButtonHandler extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(ctx, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button
        });
    }

    // @ts-ignore
    public override parse(interaction: ButtonInteraction) {
        return this.some();
    }

    public async run(interaction: ButtonInteraction) {
        return;
        await interaction.reply({
            content: 'Loading...',
            // Let's make it so only the person who pressed the button can see this message!
            ephemeral: true
        });
        
        switch (interaction.customId){
            case `Add`:
                this.add(interaction);
                break;
            case `Remove`:
                this.remove(interaction)
                break;
            case `forward`:
                this.forward(interaction)
                break;
            case `back`:
                this.back(interaction)
                break;
            default:
                console.log(`Button not found`)
                break;
                
        }
    }

    public async add(interaction: ButtonInteraction) {
        interaction.editReply(`added`)
    }

    public async remove(interaction: ButtonInteraction) {
        interaction.editReply(`removed`)
    }

    public async forward(interaction: ButtonInteraction) {
        interaction.editReply(`forward`)
    }

    public async back(interaction: ButtonInteraction) {
        interaction.editReply(`back`)
    }
}