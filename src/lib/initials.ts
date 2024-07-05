// This file will contain the initial objects for use in the application

import { Player, PlayerPreferences, Character, Game, GameState, GameMode, CharacterMode, Inventory, PlayerGuildInfo, GameStatus } from './bot.types'




export const initialPreferenceObject: PlayerPreferences = {
    FAVORED: [],
    NEUTRAL: [],
    DISLIKED: [],
    ASKFIRST: [],
    HARDNO: []
}

export const initialPlayer: Player = {
    userId: '',
    characters: [],
    decks: [],
    guilds: {},
    preferences: initialPreferenceObject
}

export const initialCharacter: Character = {
    name: '',
    avatar: '',
    description: '',
    mentalEffects: [],
    physicalEffects: [],
    mindBroken: false,
    mindControlled: null,
    mindControlLeft: 0,
    ableToDraw: true,
    collared: false,
    permaCollared: false,
    collarUnlockTime: null,
    collarer: null,
    locked: false,
    badEnd: false,
    mode: CharacterMode.NORMAL,
    creator: '',
    guilds: [],
    preferences: initialPreferenceObject
}

export const initialInventory: Inventory = {
    shield: 0,
    reverse: 0,
    extraTurn: 0,
    cleanse: 0,
    steal: 0,
    tempLock: 0,
    tempCollar: 0,
    permaCollar: 0,
    collarKey: 0,
}

export const initialGuildInfo: PlayerGuildInfo = {
    games: [],
    gold: 0,
    inventory: initialInventory,
    blocked: [],
    permaCollared: false,
    collarOwner: null
}


export const initialGameState: GameState = {
    currentPlayer: null,
    turnOrder: [],
    deck: [],
    discard: [],
    lastCard: null, 
    lastPlayer: null,
    lastAction: null,
    status: GameStatus.WAITINGFORPLAYERS,
    turn: 0,
    afkPlayers: []
}

export const initialGame: Game = {
    players: {},
    channel: '',
    inThread: false,
    threadId: null,
    state: initialGameState,
    gameMode: GameMode.NORMAL,
}

export const initialShopInventory = {
    shield: {
        name: 'Shield',
        description: 'Prevent the next effect that would happen to you',
        cost: 5
    },
    reverse: {
        name: 'Reverse',
        description: 'Reverse the next effect that would happen to you',
        cost: 15
    },
    extraTurn: {
        name: 'Extra Turn',
        description: 'Take an extra turn',
        cost: 100
    },
    reroll: {
        name: 'Reroll',
        description: 'Reroll your character',
        cost: 25
    },
    steal: {
        name: 'Steal',
        description: 'Steal an item from another player',
        cost: 50
    },
    cleanse: {
        name: 'Cleanse',
        description: 'Remove all effects from you',
        cost: 20
    },
}