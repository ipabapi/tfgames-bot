import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class GameActivePrecondition extends Precondition {
    public run(interaction: CommandInteraction) {
        if (interaction.userData?.game) return this.ok();
        return this.error({ message: 'This channel is currently not in a game.' });
    }

    public override chatInputRun(interaction: CommandInteraction) {
        if (interaction.userData?.game) return this.ok();
        return this.error({ message: 'This channel is currently not in a game.' });
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        GameActive: never;
    }
}