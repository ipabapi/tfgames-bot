// This file is to declare user settings for the bot

import { Subcommand } from "@sapphire/plugin-subcommands";
import {
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';
import {container} from "@sapphire/framework";

export class DeckCommand extends Subcommand {
    constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
        super(context, {
            ...options,
            name: 'deck',
            description: 'Edit, view, delete, or create a deck.',
            subcommands: [
                {
                    name: 'view',
                    messageRun: 'deckView',
                    chatInputRun: 'deckView',
                    default: true
                },
                {
                    name: 'edit',
                    messageRun: 'deckEdit',
                    chatInputRun: 'deckEdit'
                },
                {
                    name: 'delete',
                    messageRun: 'deckDelete',
                    chatInputRun: 'deckDelete'
                },
                {
                    name: 'create',
                    messageRun: 'deckCreate',
                    chatInputRun: 'deckCreate'
                },
                {
                    name: 'list',
                    messageRun: 'deckList',
                    chatInputRun: 'deckList'
                }
            ]
        });

    }

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('deck')
                .setDescription('Edit, view, delete, or create a deck.') // Needed even though base command isn't displayed to end user
                .addSubcommand((command) => 
                    command.setName('view')
                        .setDescription('Shows the selected deck')
                        .addStringOption((option) => 
                            option.setName('name').setDescription('Name of the deck to view').setRequired(true)))
                .addSubcommand((command) =>
                    command
                        .setName('edit')
                        .setDescription('Edits the selected deck')
                        .addStringOption((option) => 
                            option.setName('name').setDescription('Name of the deck to edit').setRequired(true))
                )
                .addSubcommand((command) =>
                    command
                        .setName('delete')
                        .setDescription('Remove a deck')
                        .addStringOption((option) =>
                            option.setName('name').setDescription('Name of the deck to edit').setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName('create')
                        .setDescription('Creates a deck with the provided Name')
                        .addStringOption((option) =>
                            option.setName('name').setDescription('Name of the deck to create').setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName('list')
                        .setDescription('List all of your decks')
                )
        );
        
    }

    public async deckView(interaction: Subcommand.ChatInputCommandInteraction) {
        const deckName = interaction.options.getString('name')
        await interaction.reply({ content: `## Viewing Deck: ${deckName}\n- Shield - x1\n- Reverse - x2`, ephemeral: false, fetchReply: true });
        
    }

    public async deckEdit(interaction: Subcommand.ChatInputCommandInteraction) {
        const deckName = interaction.options.getString('name')
        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Editing Deck: ${deckName}`)
            .setAuthor({ name: 'TF Bot', iconURL: 'https://i.imgur.com/8jHdyut.png'})
            .setDescription('*Your deck currently contains:*\n- Shield - x1\n- Reverse - x2')
            .addFields(
                { name: 'Capacity', value: '3/30' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Collection', value: '*Reverse* - **Shield - 5x** - *Body TF*', inline: true },
            )
            .setImage('https://i.imgur.com/oGQRtdD.png')
            .setTimestamp();
        
        await interaction.reply({embeds: [exampleEmbed.toJSON()],ephemeral: true});
        
        // @ts-ignore
        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm Ban')
            .setStyle(ButtonStyle.Danger);

        // @ts-ignore
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        //const row = new ActionRowBuilder()

        //await interaction.reply({components: row.toJSON()});
    }

    public async deckCreate(interaction: Subcommand.ChatInputCommandInteraction) {
        const deckName = interaction.options.getString('name')
        await interaction.reply({ content: `Creating Deck ${deckName}`, ephemeral: true, fetchReply: true });
            
            // check if deck already exists
            // @ts-ignore
            var query = { player: interaction.member.id, name: deckName};
            // @ts-ignore
            var result = await container.mongoClient.db('test').collection('deck').find(query)
            if ((await result.toArray()).length == 0 ) {
            // @ts-ignore
            container.mongoClient.db('test').collection('deck').insertOne({ player: interaction.member.id, name : deckName, cardIds: []});
            interaction.editReply({content:`Deck ${deckName} successfully created`})
            } else{
                interaction.editReply({content:`Unable to create Deck ${deckName}. Deck with same name registered to same player already exists`});
            }
        

    }

    public async deckDelete(interaction: Subcommand.ChatInputCommandInteraction) {
        const deckName = interaction.options.getString('name')
        await interaction.reply({ content: `Deleting Deck ${deckName}`, ephemeral: true, fetchReply: true });

        // check if deck already exists
        // @ts-ignore
        var query = { player: interaction.member.id, name: deckName};
        // @ts-ignore
        var result = await container.mongoClient.db('test').collection('deck').find(query)
        if ((await result.toArray()).length != 0 ) {
            // @ts-ignore
            container.mongoClient.db('test').collection('deck').deleteMany({ player: interaction.member.id, name : deckName});
            interaction.editReply({content:`Deck ${deckName} successfully deleted`})
        } else{
            interaction.editReply({content:`Unable to delete Deck ${deckName}. Does not exist.`});
        }


    }
    
    public async deckList(interaction: Subcommand.ChatInputCommandInteraction) {
        // @ts-ignore
        var query = { player: interaction.member.id };
        // @ts-ignore
        var result = await container.mongoClient.db('test').collection('deck').find(query)
        
        // @ts-ignore
        var deckListString = `## Deck List for ${interaction.member.toString()}\n`
        for (const deck of await result.toArray()) {
            deckListString += deck.name + "\n";
        }
        
        //interaction.editReply({content:`Unable to create Deck ${deckName}`});
        interaction.reply({content: deckListString, ephemeral: true})


    }

}