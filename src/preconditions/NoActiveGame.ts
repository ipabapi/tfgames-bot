import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class NoActiveGamePrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        return await this.checkGame(interaction);
    }

    private async checkGame(interaction: CommandInteraction) {
        const game = await this.container.game.findOne({channel: interaction.channel?.id});
        if (!game) {
            return this.error({ message: 'There isn\'t a game in this channel yet! Start one by doing `/game start`.' });
        }
        return this.ok();
    }

}

declare module '@sapphire/framework' {
    interface Preconditions {
        NoActiveGame: never;
    }
}