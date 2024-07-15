
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { CharacterModal } from '../lib/handlers/characterManager';
import { Character } from '../lib/bot.types';
import { ObjectId } from 'mongodb';

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

        if (interaction.customId.startsWith('edit-character')) {
            const characterId = interaction.customId.split('-')[2];
            const character = await this.container.characters.findOne({ _id: new ObjectId(characterId) }) as Character;
            if (!character) return await interaction.reply('Character not found');
            if (character.creator !== interaction.user.id) return await interaction.reply('You do not own this character');
            return await interaction.showModal(CharacterModal(character))
        }
        
        switch (interaction.customId){
            case `game-join`:
                this.container.GameManager.choosePlayerAndDeck(interaction);
                break;
            case 'create-character':
                await interaction.showModal(CharacterModal())
                break;
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