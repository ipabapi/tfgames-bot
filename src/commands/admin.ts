// This file is so admins can control specific things in the bot, such as game channels, overwrite users or gold, ban them from the bot, etc.

import { Subcommand } from "@sapphire/plugin-subcommands";

export class AdminCommand extends Subcommand {
    constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: 'admin',
            description: 'For admins to control the bot.',
            subcommands: [
                {
                    name: 'prefix',
                    messageRun: 'prefix',
                    chatInputRun: 'prefix',
                }
            ]
        });

    }
}