import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction } from 'discord.js';
import { initialCharacter } from '../initials';
import { container } from '@sapphire/framework';
import { Character } from '../bot.types';
import { ObjectId } from 'mongodb';

export const CharacterModal = (characterObj?: Character) => {
    
	const modal = new ModalBuilder()
		.setCustomId(characterObj ? `chara-edit-${characterObj._id?.toString()}-modal` : 'chara-modal')
		.setTitle(characterObj ? 'Edit Character' : 'Create Character');

	const character = new TextInputBuilder()
		.setCustomId('chara-name')
		.setLabel('Character Name')
		.setPlaceholder('Enter your character name')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	const avatar = new TextInputBuilder()
		.setCustomId('chara-avatar')
		.setLabel('Character Avatar')
		.setPlaceholder('Enter your character avatar URL')
		.setStyle(TextInputStyle.Short)
		.setRequired(false);

	const description = new TextInputBuilder()
		.setCustomId('chara-desc')
		.setLabel('Character Description')
		.setPlaceholder('Enter your character description')
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true);

	if (characterObj) {
		character.setValue(characterObj.name);
		characterObj.avatar && avatar.setValue(characterObj.avatar);
		description.setValue(characterObj.description);
	}

	const components = [character, avatar, description].map((component) =>
		new ActionRowBuilder().addComponents(component)
	) as ActionRowBuilder<TextInputBuilder>[];
	// must be spread over the args
	modal.addComponents(...components);

	return modal;
};

export async function createCharacter(interaction: ModalSubmitInteraction) {
	const characterName = interaction.fields.getField('chara-name').value;
	const characterAvatar = interaction.fields.getField('chara-avatar').value;
	const characterDesc = interaction.fields.getField('chara-desc').value;
	// Make sure that a character with the same name doesn't exist for the user
	const check = await container.characters.findOne({ name: characterName, creator: interaction.user.id });
	if (check) return interaction.reply({ content: 'You already have a character with that name.', ephemeral: true });
	// Create the character
	const initCharacter = { ...initialCharacter };
	initCharacter.name = characterName;
	// check if the avatar is provided, and if it is a valid URL
	if (characterAvatar) {
		if (!characterAvatar.startsWith('http')) return interaction.reply({ content: 'The avatar URL must start with http.', ephemeral: true });
		initCharacter.avatar = characterAvatar;
	}
	initCharacter.description = characterDesc;
	initCharacter.creator = interaction.user.id;
	const newChar = await container.characters.insertOne(initCharacter);
	//@ts-ignore
	const result = await container.users.updateOne({ userId: interaction.user.id }, { $push: { characters: newChar.insertedId.toString() } });
	if (result.modifiedCount !== 1) return interaction.reply({ content: 'An error occurred while creating the character.', ephemeral: true });

	return interaction.reply({ content: 'Character created!', ephemeral: true });
}

export async function editCharacter(interaction: ModalSubmitInteraction) {
	// Get the character ID from the custom ID
	const charId = interaction.customId.split('-')[2];
	const characterName = interaction.fields.getField('chara-name').value;
	const characterAvatar = interaction.fields.getField('chara-avatar').value;
	const characterDesc = interaction.fields.getField('chara-desc').value;
	// Make sure that a character with the same name doesn't exist for the user
	const check = await container.characters.findOne({ name: characterName, creator: interaction.user.id });
	if (check && check._id.toString() !== charId)
		return interaction.reply({ content: 'You already have a character with that name.', ephemeral: true });
	const updateObj = {
		name: characterName,
		description: characterDesc
	} as {
		name: string;
		description: string;
		avatar?: string;
	};
	if (characterAvatar) {
		if (!characterAvatar.startsWith('http')) return interaction.reply({ content: 'The avatar URL must start with http.', ephemeral: true });
		updateObj['avatar'] = characterAvatar;
	}
	const result = await container.characters.updateOne({ _id: new ObjectId(charId), creator: interaction.user.id }, { $set: updateObj });
	if (result.modifiedCount !== 1) return interaction.reply({ content: 'An error occurred while updating the character.', ephemeral: true });
	return interaction.reply({ content: 'Character updated!', ephemeral: true });
}
