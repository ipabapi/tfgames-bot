import { SapphireClient } from '@sapphire/framework';
import { getRootData } from '@sapphire/pieces';
import type { ClientOptions } from 'discord.js';
import { join } from 'node:path';
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import { container} from '@sapphire/framework';
import type { Message } from 'discord.js';

export class CogClient extends SapphireClient {
    private rootData = getRootData();

    public constructor(options: ClientOptions) {
        super(options);

        this.stores.registerPath(join(this.rootData.root, 'game'));
    }

    public override async login(token?: string) {
        container.database = null;
        return super.login(token);
    }

    // We override destroy to kill the connection to our database before logging out at Discord
    public override async destroy() {
        //await container.database.destroy();
        return super.destroy();
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        database: null; // Replace this with the connection type of your database library
    }
}
