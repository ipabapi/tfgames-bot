// This file is to declare user settings for the bot

import { Subcommand } from "@sapphire/plugin-subcommands";

export class DeckCommand extends Subcommand {
    constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: 'deck',
            description: 'Edit, view, delete, or create a deck.',
            subcommands: [
                {
                    name: 'view',
                    messageRun: 'view',
                    chatInputRun: 'view',
                }
            ]
        });

    }

}