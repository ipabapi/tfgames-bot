import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class OwnerOnlyPrecondition extends Precondition {
    public run(message: CommandInteraction) {
        return this.determine(message);
    }

    public override chatInputRun(message: CommandInteraction) {
        return this.determine(message);
    }
    
    public determine(message: CommandInteraction) {
        return message.user.id === this.container.ownerId ? this.ok() : this.error({ message: 'This command can only be used by the bot owner.' });
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        OwnerOnly: never;
    }
}