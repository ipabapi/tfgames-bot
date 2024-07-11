import {  Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class NoActiveGamePrecondition extends Precondition {
   public run(message: CommandInteraction) {
         return this.checkGame(message);
    }

    public override chatInputRun(message: CommandInteraction) {        
        return this.checkGame(message)
    }

    public checkGame(message: CommandInteraction) {
        return message.userData?.game ? this.error({ message: 'You are already in a game. Please finish it before starting a new one.',
        context: { silent: false}
         }) : this.ok();
    }

}

declare module '@sapphire/framework' {
    interface Preconditions {
        NoActiveGame: never;
    }
}

