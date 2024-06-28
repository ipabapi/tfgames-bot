// This file is to declare user settings for the bot

import { Subcommand } from "@sapphire/plugin-subcommands";

export class SettingsCommand extends Subcommand {
    constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: 'settings',
            description: 'Change the bot settings',
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