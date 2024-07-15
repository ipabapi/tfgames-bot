import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class IsTurnPrecondition extends Precondition {
    public run(message: CommandInteraction) {
        return this.checkGame(message);
    }

    public override chatInputRun(message: CommandInteraction) {
        
        return this.checkGame(message)
    }

    public checkGame(message: CommandInteraction) {
        return message.userData?.game?.state.currentPlayer === message.user.id ? this.ok() : this.error({ message: 'It is not your turn.',
        context: { silent: false}
         });
    }

}

declare module '@sapphire/framework' {
    interface Preconditions {
        IsTurn: never;
    }
}