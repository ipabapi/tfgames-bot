import { InteractionHandler } from "@sapphire/framework";
import { StringSelectMenuInteraction } from "discord.js";


export class StringSelectHandler extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(ctx, options);
    }

    // @ts-ignore
    public override parse(interaction: StringSelectMenuInteraction) {
        return this.some();
    }

    public async run(interaction: StringSelectMenuInteraction) {
        console.log(interaction.values)
        interaction.reply({ content: 'You selected ' + interaction.values[0], ephemeral: true })
    }    
}