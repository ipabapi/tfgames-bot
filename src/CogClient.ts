import { SapphireClient } from '@sapphire/framework';
import { getRootData } from '@sapphire/pieces';
import type { ClientOptions } from 'discord.js';
import { join } from 'node:path';
import { container} from '@sapphire/framework';
import {MongoClient, ServerApiVersion} from 'mongodb';
import dotenv from 'dotenv';

export class CogClient extends SapphireClient {
    private rootData = getRootData();

    public constructor(options: ClientOptions) {
        super(options);

        this.stores.registerPath(join(this.rootData.root, 'game'));
    }

    public override async login(token?: string) {
        //attempt to connect to MongoDB
        dotenv.config();
        const dbUri = process.env.DB_URI
        console.log(dbUri);
        if (typeof dbUri === "undefined"){
            throw new Error('Missing database URI');
        }
        try {
            // Create a MongoClient with a MongoClientOptions object to set the Stable API version
            const mongoClient= new MongoClient(dbUri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });
            console.log('Connecting to MongoDB...');
            await mongoClient.connect();
            // Send a ping to confirm a successful connection
            await mongoClient.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");

            container.database = mongoClient;
        } catch (error) {
            console.error('Connection to MongoDB Atlas failed!', error);
            process.exit();
        }
        //proceed with discord login
        return super.login(token);
    }

    // We override destroy to kill the connection to our database before logging out at Discord
    public override async destroy() {
        return super.destroy();
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        database: MongoClient; // Replace this with the connection type of your database library
    }
}
