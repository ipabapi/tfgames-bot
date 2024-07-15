import type { Events } from '@sapphire/framework';
import { Listener,  } from '@sapphire/framework';
import { Interaction } from 'discord.js';

export class UserEvent extends Listener<typeof Events.InteractionCreate> {
    // @ts-ignore
	public override async run(interaction: Interaction) {
        return;
    }
	
}
