import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';
import { GameStatus } from '../lib/bot.types';

export class WaitingForPlayers extends Precondition {
    public run(interaction: CommandInteraction) {
        console.log(interaction)
        if (interaction.userData?.game.state.status === GameStatus.WAITINGFORPLAYERS) return this.error({ message: 'The game has not started yet! Please use `/begingame` to start the game.' });
        return this.ok();
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        WaitingForPlayers: never;
    }
}