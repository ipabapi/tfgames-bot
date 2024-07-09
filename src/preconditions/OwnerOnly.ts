import { Precondition } from '@sapphire/framework';
import { CommandInteraction} from 'discord.js';

export class OwnerOnlyPrecondition extends Precondition {
    public run(message: CommandInteraction) {
        return message.user.id === this.container.ownerId ? this.ok() : this.error({ message: 'This command can only be used by the bot owner.' });
    }
}