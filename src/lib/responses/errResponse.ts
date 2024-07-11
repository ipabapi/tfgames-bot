// This file will be an export of responses that are used for error handling

export default function errResponse() {
	return {
		UNKNOWN: 'An unknown error occurred',
		PERM_FAIL: 'You do not have permission to use this command!',
		NO_GAME: 'There is no game in this channel! Please start a game with `/game start`',
		NOT_GUILD: 'This command can only be used in a Server!',
		GAME_EXISTS: 'There is already a game in this channel!',
		NOT_READY: 'Not all players are ready!',
		NOT_GAME: 'You are not in the game in this channel!',
		NOT_TURN: 'It is not your turn!',
		FAIL_SELFADV: 'You cannot advance the game after drawing a fail card!',
		FAIL_NOTCLAIMADV: 'You cannot advance the game, the user who has claimed the fail card must advance the game!',
		FAIL_SELF: 'You cannot claim your own fail card!',
		FAIL_CLAIMED: 'This fail card has already been claimed!',
		FAIL_NODRAW: 'There is not a fail to claim!',
		GAME_NOTSTARTED: 'The game has not started yet!',
		ITEM_NOTFOUND: 'The item you are looking for was not found!',
		ITEM_NOTOWNED: 'You do not own this item!',
		TYPE_ERROR: 'The requested type was not found...',
		SHIELD_ACTIVE: 'You already have a shield active!',
		STEAL_ACTIVE: 'This player already has a steal waiting on them!',
		STEAL_SELF: 'You cannot steal from yourself!',
		EXTRA_TURN_ACTIVE: 'You already have an extra turn active!',
		GOLD_NOTENOUGH: 'You do not have enough gold to purchase this item!',
		TIMEOUT: 'You have taken too long to respond!',
		DECLINE_TERMS:
			'You have declined the terms. You will not be able to use the bot until you accept the terms. If you would like to accept the terms, please run the command again.',
		NOT_SETUP: 'You have not accepted our Terms of Service and Privacy Policy. Please run `/setup` to accept the terms.',
		NO_CHARACTER: 'You do not have a character set up yet. Please use `/character create` to create a character.',
		NO_CHARACTER_FOUND: 'No character was found for this user.',
		NO_DECK: "You don't have a deck! Please use `/deck create` to create a deck."
	};
}
