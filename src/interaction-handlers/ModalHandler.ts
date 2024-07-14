import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';
import { createCharacter } from '../lib/handlers/characterManager';

export class ModalHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit
    });
  }

  public override parse(interaction: ModalSubmitInteraction) {
    console.log(interaction.customId)
    switch (interaction.customId) {
      case 'chara-modal':
        return this.some();
      default:
        return this.none();
    }
  }

  public async run(interaction: ModalSubmitInteraction) {
    console.log(interaction.customId)
    switch (interaction.customId) {
      case 'chara-modal':
        createCharacter(interaction);
        break;
      default:
        console.log(`Modal not found`);
        break;
    }
  }
}