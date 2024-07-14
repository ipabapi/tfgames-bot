//@ts-nocheck
import { ActionRowBuilder, Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction} from "discord.js"
import { initialCharacter } from "../initials"


export const CharacterModal = () => {

    const modal = new ModalBuilder()
    .setCustomId('chara-modal')
    .setTitle('Character Creation')

    const character = new TextInputBuilder()
    .setCustomId('chara-name')
    .setLabel('Character Name')
    .setPlaceholder('Enter your character name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

    const avatar = new TextInputBuilder()
    .setCustomId('chara-avatar')
    .setLabel('Character Avatar')
    .setPlaceholder('Enter your character avatar URL')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)

    const description = new TextInputBuilder()
    .setCustomId('chara-desc')
    .setLabel('Character Description')
    .setPlaceholder('Enter your character description')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)

    const components = [character, avatar, description].map((component) => new ActionRowBuilder().addComponents(component))
    // must be spread over the args
    modal.addComponents(...components)

    return modal
}

export function createCharacter(interaction: ModalSubmitInteraction) {
    const characterName = interaction.fields.getField('chara-name').value
    const characterAvatar = interaction.fields.getField('chara-avatar').value
    const characterDesc = interaction.fields.getField('chara-desc').value
    // Make sure that a character with the same name doesn't exist for the user
    const check = await container.characters.findOne({ name: characterName, creator: interaction.user.id })
    if (check) return interaction.reply({ content: 'You already have a character with that name.', ephemeral: true })
    // Create the character
    const initCharacter = {...initialCharacter};
    iniCharacter.name = characterName
    // check if the avatar is provided, and if it is a valid URL
    if (characterAvatar) {
        if (!characterAvatar.startsWith('http')) return interaction.reply({ content: 'The avatar URL must start with http.', ephemeral: true })
        initCharacter.avatar = characterAvatar
    }
    initCharacter.description = characterDesc
    initCharacter.creator = interaction.user.id
    const newChar = await container.characters.insertOne(result)
    const result = await container.users.updateOne({ id: interaction.user.id }, { $push: { characters: newChar.insertedId } })
    if (result.modifiedCount !== 1) return interaction.reply({ content: 'An error occurred while creating the character.', ephemeral: true })
    
    interaction.reply({ content: 'Character created!', ephemeral: true })

}