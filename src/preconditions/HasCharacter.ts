import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class HasCharacterPrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        return await this.checkCharacter(interaction);
    }

    private async checkCharacter(interaction: CommandInteraction) {
        const character = await this.container.users.findOne({userId: interaction.user.id});
        if (!character) {
            return this.error({ message: 'You do not have a character yet!' });
        }

        return this.ok();
    }
}