import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class HasCharacterPrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        return await this.checkCharacter(interaction);
    }

    private async checkCharacter(interaction: CommandInteraction) {
        if (!interaction.userData?.player?.characters) {
            return this.error({ message: 'You do not have a character yet. Use the `/character create` command to create one.' });
        }

        return this.ok();
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        HasCharacter: never;
    }
}