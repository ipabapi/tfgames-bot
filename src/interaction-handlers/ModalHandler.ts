import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';
import { createCharacter, editCharacter } from '../lib/handlers/characterManager';

export class ModalHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit
    });
  }

  public override parse(interaction: ModalSubmitInteraction) {
    switch (true) {
      case interaction.customId === 'chara-modal':
        return this.some();
      case interaction.customId.startsWith('chara-edit'):
        return this.some();
      default:
        return this.none();
    }
  }

  public async run(interaction: ModalSubmitInteraction) {
    switch (true) {
      case interaction.customId === 'chara-modal':
        createCharacter(interaction);
        break;
      case interaction.customId.startsWith('chara-edit'):
        editCharacter(interaction);
        break;
      default:
        console.log(`Modal not found`);
        break;
    }
  }
}