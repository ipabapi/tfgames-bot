import {container} from "@sapphire/framework";
export class DeckBusinessLogic{
public async CreateBaseDeck (playerId:string){
    console.log('Creating Base deck');
    const deck = await container.deck.findOne({player: playerId, name: 'Starting Deck'})
    if(deck){
        console.log('Deck already exists');
        return;
    }
    container.deck.insertOne({
        player: playerId,
        name: 'Starting Deck',
        cardIds: ['card_0001','card_0002','card_0003','card_0004','card_0005','card_0006','card_0007','card_0010','card_0011','card_0012','card_0013','card_0014','card_0015']
    });
}

}