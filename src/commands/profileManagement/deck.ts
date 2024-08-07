// This file is to declare user settings for the bot

import {Subcommand} from "@sapphire/plugin-subcommands";
import {container} from "@sapphire/framework";
import {MessageBuilder} from "@sapphire/discord.js-utilities";

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
        var query = { player: interaction.user.id, name: deckName };
        var dbResult = await container.deck.find(query)

        var result = await dbResult.toArray()
        var deckStrings = '';
        const {cardIds} = result[0];
        for (let cardId in cardIds) {
            var card = await container.cards.find({stringID: cardIds[cardId]})
            var cardAwaited = await card.toArray()
            deckStrings +=  '- ' + cardAwaited[0].name + '\n'
            
        } 
        
        await interaction.reply({ content: `## Viewing Deck: ${deckName}\n` + deckStrings, ephemeral: false, fetchReply: true });
        
    }

    public async deckEdit(interaction: Subcommand.ChatInputCommandInteraction) {
        const deckName = interaction.options.getString('name')
        const msg = new MessageBuilder()
            .setEmbeds([
                {
                    title: `Editing Deck: ${deckName}`,
                    description: '*Your deck currently contains:*\n- Shield - x1\n- Reverse - x2',
                    fields: [
                        { name: 'Capacity', value: '3/30' },
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Collection', value: '*Reverse* - **Shield - 5x** - *Body TF*', inline: true },
                    ],
                    image: { url: 'https://i.imgur.com/oGQRtdD.png' },
                    color: 0x0099FF,
                }])
            .setComponents([
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'back',
                            label: '⮜',
                        },
                        {
                            type: 2,
                            style: 3,
                            custom_id: 'Add',
                            label: 'Include',
                        },
                        {
                            type: 2,
                            style:4,
                            custom_id: 'Remove',
                            label: 'Remove',
                        },
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'forward',
                            label: '⮞',
                        }
                    ],
                }])

        await interaction.reply(msg);

    }

    public async deckCreate(interaction: Subcommand.ChatInputCommandInteraction) {
        const deckName = interaction.options.getString('name')
        await interaction.reply({ content: `Creating Deck ${deckName}`, ephemeral: true, fetchReply: true });
            
            // check if deck already exists
            var query = { player: interaction.user.id, name: deckName};
            var result = await container.deck.find(query)
            if ((await result.toArray()).length == 0 ) {
            container.deck.insertOne({ player: interaction.user.id, name : deckName, cardIds: []});
            interaction.editReply({content:`Deck ${deckName} successfully created`})
            } else{
                interaction.editReply({content:`Unable to create Deck ${deckName}. Deck with same name registered to same player already exists`});
            }
        

    }

    public async deckDelete(interaction: Subcommand.ChatInputCommandInteraction) {
        const deckName = interaction.options.getString('name')
        await interaction.reply({ content: `Deleting Deck ${deckName}`, ephemeral: true, fetchReply: true });

        // check if deck already exists
        var query = { player: interaction.user.id, name: deckName};
        var result = await container.deck.find(query)
        if ((await result.toArray()).length != 0 ) {
            container.deck.deleteMany({ player: interaction.user.id, name : deckName});
            interaction.editReply({content:`Deck ${deckName} successfully deleted`})
        } else{
            interaction.editReply({content:`Unable to delete Deck ${deckName}. Does not exist.`});
        }


    }
    
    public async deckList(interaction: Subcommand.ChatInputCommandInteraction) {
        var query = { player: interaction.user.id };
        var result = await container.deck.find(query)
        var deckListString = `## Deck List for ${interaction.user.toString()}\n`
        for (const deck of await result.toArray()) {
            deckListString += "- " + deck.name + "\n";
        }
        
        //interaction.editReply({content:`Unable to create Deck ${deckName}`});
        interaction.reply({content: deckListString, ephemeral: true})


    }
}