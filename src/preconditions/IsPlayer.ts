import { Precondition } from '@sapphire/framework';
import { CommandInteraction} from 'discord.js';

export class IsPlayer extends Precondition {
    public run(interaction: CommandInteraction) {
        if (!interaction.userData?.game) return this.error({ message: 'Game not found!' });
        return Object.keys(interaction.userData?.game.players).includes(interaction.user.id)
            ? this.ok()
            : this.error({ message: 'You are not a player in this game!' });
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        IsPlayer: never;
    }
}