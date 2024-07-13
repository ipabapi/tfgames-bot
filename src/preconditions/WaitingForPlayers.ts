import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';
import { GameStatus } from '../lib/bot.types';

export class WaitingForPlayers extends Precondition {
    public run(interaction: CommandInteraction) {
        if (interaction.userData?.game.state.status === GameStatus.WAITINGFORPLAYERS) return this.error({ message: 'The game has not started yet! Please use `/begingame` to start the game.' });
        return this.ok();
    }
    public override chatInputRun(interaction: CommandInteraction) {
        return this.run(interaction);
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        WaitingForPlayers: never;
    }
}