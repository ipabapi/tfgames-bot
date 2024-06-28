// import object id type from mongodb
import { ObjectId } from 'mongodb';



export interface Player {
    _id: ObjectId;
    userId: string; // discord user id
    games: string[]; // the games the player is in, if any, will be a list of game id or else this will take forever to load
    gold: number; // the amount of gold the player has
    inventory: Inventory; // the items the player has
    characters: string[]; // the characters the player has, if any, will be a list of character id or else this will take forever to load
    preferences: PlayerPreferences; // the preferences of the player, this is their base preferences, the character preferences will override this
    blocked: string[]; // the players the player has blocked, if the blocked player tries to join a game the player is in, the game will refuse
    permaCollared: boolean; // if the player is permanently collared, this will be a high price item for the shop
    collarOwner: string | null; // the player that collared the player, if any
    timeout: {
        timeoutScheduled: boolean; // if a timeout is scheduled
        timeoutTime: Date | null; // the time the timeout is scheduled
        timeoutDuration: number; // the duration of the timeout
        timeoutRepeat: boolean; // if the timeout is repeatable
        timeoutRepeatCondition: string | null; // the condition for the timeout to repeat
        //TODO: Figure out how to set the timeout to weekdays
    }
}


// These are the preferences a player can select for a character, they will be used to determine what cards others can play on them, and what cards they will get from booster packs. This also alows us to provide a more robust consent system.
export enum PreferenceChart {
    FAVORITE = 'FAVORITE', // The player loves seeing this happen to their character.
    LIKE = 'LIKE', // The player likes seeing this happen to their character.
    NEUTRAL = 'NEUTRAL', // The player doesn't mind seeing this happen to their character.
    UNSURE = 'UNSURE', // The player is unsure about seeing this happen to their character.
    ASK = 'ASK', // The player wants to be asked before this happens to their character.
    DISLIKE = 'DISLIKE', // The player dislikes seeing this happen to their character.
    HATE = 'HATE', // The player hates seeing this happen to their character.
    NO = 'NO' // The player does not want this to happen to their character and trying to put this on them will result in disciplinary action. (Under normal circumstances if the card is in a player's deck to be added to the main draw pile, the player will be prompted to replace it before joining, if they refuse, they will be removed from the game. They can choose to replace it with a card of their choosing or a random card from their inventory. If there is no card in their inventory, the bot will choose a random common card from the card database.)
}

export interface PlayerPreferences {
    TF: PreferenceChart;
    SYSTEM: PreferenceChart;
    GOLD: PreferenceChart;
    ITEM: PreferenceChart;
    OTHER: PreferenceChart;
    FAVORED: string[]; // The player's favored tags, these will be used to determine what cards they will get from booster packs, and what cards others can play on them. The player can have up to 5 favored tags.
    DISLIKED: string[]; // The player's disfavored tags, these will be used to determine what cards they will get from booster packs, and what cards others can play on them. The player can have up to 5 disfavored tags.
    //TODO: Change this to more robust consent system, at work right now so can't think of it and shouldn't be writing out a list of tags in this atm.
}

export interface Character {
    _id: ObjectId;
    name: string; // the name of the character
    avatar: string; // the avatar of the character
    description: string; // the description of the character
    mentalEffects: string[]; // the mental effects the character has
    physicalEffects: string[]; // the physical effects the character has
    mindBroken: boolean; // if the character is mind broken
    mindControlled: string | null; // the player that is mind controlling the character, if any
    mindControlLeft: number; // the amount of turns left for mind control
    ableToDraw: boolean; // if the character is able to draw a card, if not, the bot will draw for them
    collared: boolean; // if the character is collared
    permaCollared: boolean; // if the character is permanently collared
    collarUnlockTime: Date | null; // the time the collar will unlock, if any
    collarer: string | null; // the player that collared the character, if any
    locked: boolean; // if the character is locked
    badEnd: boolean; // if the character has a bad end
    mode: CharacterMode; // the mode of the character
    preferences: PlayerPreferences; // the preferences of the character, this will override the player's preferences, NOTE: The player's preferences will be used if the character's preferences are not set, if a collar owner tries to change a NO preference to a different preference, the collared will be prompted to accept or deny the change, if they deny, the collared will then be prompted to accept or deny the collar removal, if they deny, the collar will remain on the character, if they accept, the collar will be removed and the collar owner will be reported to the server admin for disciplinary action.
}

export interface Game {
    _id: ObjectId;
    players: { [key: string]: Character }; // the players in the game
    channel: string; // the discord channel id
    inThread: boolean; // if the game is in a thread
    threadId: string | null; // the thread id
    state: GameState; // the state of the game
}

export interface Inventory {
    shield: number;
    reverse: number;
    extraTurn: number;
    cleanse: number;
    steal: number;
    tempLock: number;
    tempCollar: number;
    permaCollar: number;
    collarKey: number;
}

export interface GameState {
    currentPlayer: Player; // the player whose turn it is
    turnOrder: Player[]; // the order of the players
    deck: Card[]; // the deck of cards
    discard: Card[]; // the discard pile
    lastCard: Card | null; // the last card played
    lastPlayer: Player | null; // the last player to play a card
    lastAction: string | null; // the last action that happened, mainly for logging
    status: GameStatus; // the status of the game
    turn: number; // the current turn
}

export enum GameMode {
    NORMAL = 'NORMAL', // The base mode, the character can gain and store gold, as well as use items
    HARDCORE = 'HARDCORE', // We'll get to this later
}


export enum GameStatus {
    TURNPROCESSING = 'TURNPROCESSING',
    TURNSTART = 'TURNSTART',
    TURNEND = 'TURNEND',
    WAITINGFORPLAYERS = 'WAITINGFORPLAYERS',
    GAMEDONE = 'GAMEDONE',
    TIMEOUT = 'TIMEOUT',
    WAITING = 'WAITING',
    PAUSE = 'PAUSE',
    RESUME = 'RESUME'
}

export enum CharacterMode {
    NORMAL = 'NORMAL', // The base mode, the character can gain and store gold, as well as use items
    HARD = 'HARD', // The character can't gain or store gold, but can use items
    HARDER = 'HARDER', // The character CAN gain or store gold, but can't use items
    VERYHARD = 'VERYHARD', // The character can't gain or store gold, and can't use items
    NIGHTMARE = 'NIGHTMARE' // The character can't gain or store gold, can't use items, and can't draw cards, relying on the bot to draw for them and then a second roll (d{n being players} to determine if they can play the card or if another player will play it for them
}

export interface Card {
    _id: ObjectId;
    name: string;
    description: string;
    effect: CardEffect;
    type: CardType;
    rarity: CardRarity;
}

export interface CardEffect {
    tags: string[];
    action: string;
    singleTarget: boolean;
    multiTarget: boolean;
    targetSelf: boolean;
    randomTarget: boolean;
    allowedModes: GameMode[];
}

export enum CardType {
    TF = 'TF',
    SYSTEM = 'SYSTEM',
    GOLD = 'GOLD',
    ITEM = 'ITEM',
    OTHER = 'OTHER'
}

export enum CardRarity {
    COMMON = 'COMMON',
    UNCOMMON = 'UNCOMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    LEGENDARY = 'LEGENDARY'
}