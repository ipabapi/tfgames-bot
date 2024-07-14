import { MessageBuilder } from '@sapphire/discord.js-utilities';
import type { ChatInputCommandErrorPayload, Events } from '@sapphire/framework';
import { Listener, UserError } from '@sapphire/framework';

export class UserEvent extends Listener<typeof Events.ChatInputCommandError> {
    public override async run(error: Error, { interaction }: ChatInputCommandErrorPayload) {

        //send error details to owner
        if (this.container.ownerId.length > 0) {
        try {//@ts-ignore
        const owner = await interaction.client.users.fetch(this.container.ownerId);
        this.container.logger.info(owner)
        await owner.send(new MessageBuilder()
        .setEmbeds([{
            title: 'Error Details',
            description: `An error occurred while running a command in ${interaction.guild?.name} (${interaction.guild?.id}) #(${interaction.channel?.id})`,
            fields: [
                {
                    name: 'User',
                    value: interaction.user.tag
                },
                {
                    name: 'Command',
                    value: interaction.commandName
                },
                {
                    name: 'Error',
                    value: error.message
                },
            ],
            footer: {
                text: `Error occurred at: <t:${Math.floor(Date.now() / 1000)}:f>`
            }
        }]))
        await owner.send('```' + error.stack + '```')
        } catch (error) {
            this.container.logger.fatal(error);
        }
        }

        if (error instanceof UserError) {
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({
                    content: error.message,
                    allowedMentions: { users: [interaction.user.id], roles: [] }
                });
            }

            return interaction.reply({
                content: error.message,
                allowedMentions: { users: [interaction.user.id], roles: [] },
                ephemeral: true
            });
        }

        this.container.logger.error(error);
        if (interaction.deferred || interaction.replied) {
            return interaction.editReply({
                content: 'An unexpected error occurred while running this command.'
            });
        }

        return interaction.reply({
            content: 'An unexpected error occurred while running this command.',
            ephemeral: true
        });
    }
}