import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class CompletedSetupPrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        return await this.checkPlayer(interaction);
    }

    private async checkPlayer(interaction: CommandInteraction) {
        if (!interaction.userData?.player) {
            return this.error({ message: 'You have not accepted our Terms of Service and Privacy Policy at this time. Please accept them by running `/setup`.' });
        }
        return this.ok();
    }
}