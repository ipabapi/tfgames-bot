import { Precondition } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class HasDecksPrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction) {
        return await this.checkDecks(interaction);
    }

    private async checkDecks(interaction: CommandInteraction) {
        const decks = await this.container.deck.find({ player: interaction.user.id }).toArray();
        if (!decks.length) {
            return this.error({ message: 'You do not have any decks yet. Use the /deck create command to create one.' });
        }

        return this.ok();
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        HasDecks: never;
    }
}