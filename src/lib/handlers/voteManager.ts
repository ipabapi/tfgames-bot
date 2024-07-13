import { Subcommand } from "@sapphire/plugin-subcommands";
import { ComponentType, InteractionReplyOptions } from "discord.js";


export async function voteHandler(interaction: Subcommand.ChatInputCommandInteraction, payload: InteractionReplyOptions, cb:  (...args: any[]) => void, cbArgs: any[]) {
    const players = Object.keys(interaction.userData?.game.players || {});
    await interaction.reply({...payload, components: [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: 'Confirm',
                    customId: 'confirm',
                    emoji: {
                        name: '✅'
                    }
                },
                {
                    type: 2,
                    style: 2,
                    label: 'Deny',
                    customId: 'deny',
                    emoji: {
                        name: '❌'
                    }
                }
            ]
        }
    ]})
    .then((m) => {
        const collector = m.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });
        let votes = 0;
        let confirmed = 0;
        let voted = new Set<string>();
        collector.on('collect', async (button) => {
            if (!voted.has(button.user.id) && players.includes(button.user.id)) {
                votes++;
                if (button.customId === 'confirm') {
                    confirmed++;
                }
                voted.add(button.user.id);
                button.reply({ content: 'Vote received.', ephemeral: true });
            } else {
                button.reply({ content: 'You have already voted or are not in the game.', ephemeral: true });
            }

            if (votes === players.length) {
                collector.stop();
            }
            
        });
        collector.on('end', async () => {
            if (confirmed > votes / 2) {
                await interaction.editReply({ content: 'Vote passed.', components: [], embeds: [] });
                cb(cbArgs);
            } else {
                await interaction.editReply({ content: 'Vote failed.', components: [], embeds: [] });
            }
        }
        );
    })
}