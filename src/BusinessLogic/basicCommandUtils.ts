// THIS FILE IS STILL IN DEVELOPMENT, FOR FUTURE REFACTORING

// import { container } from '@sapphire/framework';
import { Command } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';

export const basicCommandUtils = {
    'serverOnly': async (interaction: Subcommand.ChatInputCommandInteraction | Command.ChatInputCommandInteraction) => {
        if (!interaction.inGuild()) {
            await interaction.reply('This command can only be used in a server.');
            return false;
        }
        return true;
    },




}