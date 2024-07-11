import type { ChatInputSubcommandDeniedPayload, SubcommandPluginEvents } from "@sapphire/plugin-subcommands";
import { Listener, UserError } from "@sapphire/framework";

export class UserEvent extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandDenied> {
    public override async run({ context, message: content }: UserError, { interaction }: ChatInputSubcommandDeniedPayload) {
        console.log('ChatInputSubcommandDenied');
        // `context: { silent: true }` should make UserError silent:
        // Use cases for this are for example permissions error when running the `eval` command.
        console.log(context, content);
        
        if (Reflect.get(Object(context), 'silent')) return;

        if (interaction.deferred || interaction.replied) {
            return interaction.editReply({
                content,
                allowedMentions: { users: [interaction.user.id], roles: [] }
            });
        }

        return interaction.reply({
            content,
            allowedMentions: { users: [interaction.user.id], roles: [] },
            ephemeral: true
        });
    }
    
}