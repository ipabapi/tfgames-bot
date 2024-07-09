import { ChatInputCommandInteraction, User, } from "discord.js";

// @ts-ignore
export function reverseEffect(interaction: ChatInputCommandInteraction, options: any, newUser: User, target: User, target2?: User) {

    const newInteraction = {...interaction};
    newInteraction.options = {...options}
    
    newInteraction.options.getUser = function(str, _required) {
            if (str == 'target') {
                return target;
            } else if (str == 'swaptarget') {
                return target2 || newUser;
            } else {
                return newUser
            }
        }    
    newInteraction.user = newUser;
    console.log(interaction, newInteraction)
    return newInteraction;

}