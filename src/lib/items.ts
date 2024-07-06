// This constant contains all of the items used in the inventory system

export type Item = keyof typeof items;


export const items = {
    '0001': {
        name: 'Shield',
        description: 'Block the next effect played on you',
        price: 5,
        valueName: 'shield',
        types: ['shield']
    },
    '0002': {
        name: 'Reverse',
        description: 'Reverse the next effect played on you',
        price: 15,
        valueName: 'reverse',
        types: ['reverse']
    },
    '0003': {
        name: 'Extra Turn',
        description: 'Take an extra turn',
        price: 25,
        valueName: 'extraTurn',
        types: ['extraTurn']
    },
    '0004': {
        name: 'Cleanse',
        description: 'Remove all effects from you',
        price: 50,
        valueName: 'cleanse',
        types: ['cleanse']
    },
    '0005': {
        name: 'Steal',
        description: 'Steal an item from another player',
        price: 100,
        valueName: 'steal',
        types: ['steal']
    },
    '0006': {
        name: 'Temporary Lock',
        description: 'Lock a player for a turn',
        price: 75,
        valueName: 'tempLock',
        types: ['tempLock']
    },
    '0007': {
        name: 'Temporary Collar',
        description: 'Collar a player for a turn',
        price: 100,
        valueName: 'tempCollar',
        types: ['tempCollar']
    },
    '0008': {
        name: 'Permanent Collar',
        description: 'Collar a player permanently',
        price: 200,
        valueName: 'permaCollar',
        types: ['permaCollar']
    },
    '0009': {
        name: 'Collar Key',
        description: 'Remove a collar from a player',
        price: 250,
        valueName: 'collarKey',
        types: ['collarKey']
    }
}