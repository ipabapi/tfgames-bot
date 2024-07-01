// This file is so admins can control specific things in the bot, such as game channels, overwrite users or gold, ban them from the bot, etc.

import { Subcommand } from "@sapphire/plugin-subcommands";
import {container} from "@sapphire/framework";
import * as fs from 'fs';


export class AdminCommand extends Subcommand {
    constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: 'admin',
            description: 'for admins to control the bot',
            subcommands: [
                {
                    name: 'reset',
                    messageRun: 'resetCards',
                    chatInputRun: 'resetCards',
                    default: true
                }
                
            ]
        });

    }

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description) // Needed even though base command isn't displayed to end user
                .addSubcommand((command) => command
                    .setName('reset')
                    .setDescription('Resets card table in DB. Warning: loss of data!'))
        );
    }



    public async resetCards(interaction: Subcommand.ChatInputCommandInteraction) {
        await interaction.reply({ content: `Setting up base Cards in db...`, ephemeral: true, fetchReply: true });
        await interaction.editReply({ content: `Deleting Table Cards...`});
        container.mongoClient.db('test').collection('cards').drop();
        await interaction.editReply({ content: `Inserting Initial Values...`});
        const filePath = "src/cards.json"
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                interaction.editReply('Error reading the file:'+ err);
                return;
            }
            try {
                const jsonData = JSON.parse(data);
                interaction.editReply('JSON data:'+ jsonData);
                container.mongoClient.db('test').collection('cards').insertMany(jsonData);
            } catch (err) {
                console.error('Error parsing JSON:', err);
            }
        });
        interaction.editReply({content:`Cards Sucessfully added`})
        
    }
}