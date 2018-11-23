let _exports = {}; // hack that fixes _exports for default
let runService = game.GetService('RunService');
let replicatedStorage = game.GetService("ReplicatedStorage");

const IS_CLIENT = runService.IsClient();
const IS_SERVER = runService.IsServer();
const IS_STUDIO = runService.IsStudio();

const REMOTES_FOLDER_NAME = "Remotes";
const FUNCTIONS_FOLDER_NAME = "Functions";
const EVENTS_FOLDER_NAME = "Events";

let remoteFolder: Folder, eventFolder: Folder, functionFolder: Folder;
let initialized: boolean = false;

remoteFolder = replicatedStorage.FindFirstChild(REMOTES_FOLDER_NAME) as Folder;

if (!remoteFolder) {
    remoteFolder = new Folder(replicatedStorage);
    remoteFolder.Name = REMOTES_FOLDER_NAME;
}

functionFolder = remoteFolder.FindFirstChild(FUNCTIONS_FOLDER_NAME) as Folder;
if (!functionFolder) {
    functionFolder = new Folder(remoteFolder);
    functionFolder.Name = FUNCTIONS_FOLDER_NAME;
}

eventFolder = remoteFolder.FindFirstChild(EVENTS_FOLDER_NAME) as Folder;
if (!eventFolder) {
    eventFolder = new Folder(remoteFolder);
    eventFolder.Name = EVENTS_FOLDER_NAME;
}

function EventExists(name: string)
{
    return eventFolder.FindFirstChild(name) as boolean;
}

function functionExists(name: string)
{
    return functionFolder.FindFirstChild(name) as boolean;
}

function createRemoteIfNotExist(type: "Function" | "Event", name: string)
{
    let folder : Folder;
    if (type === "Event")
        folder = eventFolder;
    else if (type === "Function")
        folder = functionFolder;
    else
        throw "Invalid type: " + type;

    let existing = folder.FindFirstChild(name) as RemoteFunction | RemoteEvent;
    if (existing)
        return existing;
    else
    {
        if (!IS_SERVER)
            throw "Creation of Events or Functions must be done on server!";

        let newb : RemoteEvent | RemoteFunction;

        if (type === "Event")
            newb = new RemoteEvent();
        else if (type === "Function")
            newb = new RemoteFunction();
        else return; // stfu

        newb.Name = name;
        newb.Parent = folder;
        return newb;
    }
}

export namespace NetInternal
{
    export abstract class FunctionBase {
        private _name: string;
        protected _instance: RemoteFunction;

        public get Name() {
            return this._name;
        }

        /**
         * @internal
         */
        constructor(name: string) {
            // let existing = functionFolder.FindFirstChild(name) as RemoteFunction;
            // if (existing)
            //     this._instance = existing;
            // else {
            //     if (!IS_SERVER)
            //         throw "Remote Function must be created on server first!";

            //     let newFunction = new RemoteFunction();
            //     newFunction.Name = name;
            //     newFunction.Parent = functionFolder;
            //     this._instance = newFunction;
            // }
            this._instance = createRemoteIfNotExist("Function", name) as RemoteFunction;
            this._name = name;
        }
    }

    export abstract class EventBase {
        private _name: string;
        protected _instance: RemoteEvent;
    
        public get Name() {
            return this._name;
        }

        /**
         * @internal
         */
        constructor(name: string) {
            // let existing = eventFolder.FindFirstChild(name) as RemoteEvent;
            // if (existing)
            //     this._instance = existing;
            // else {
            //     if (!IS_SERVER)
            //         throw "Remote Event must be created on server first!";
    
            //     let newFunction = new RemoteEvent();
            //     newFunction.Name = name;
            //     newFunction.Parent = eventFolder;
            //     this._instance = newFunction;
            // }
            this._instance = createRemoteIfNotExist("Event", name) as RemoteEvent;
    
            this._name = name;
        }
    }
}



/**
 * Typescript Networking Library for ROBLOX
 */
export namespace Net {
    interface version_t { number: number; date: number; tag?: string }

    /**
     * Version information
     * @internal
     */
    export const VERSION: version_t = {
        number: 0.20,
        date: 181106,
        tag: 'alpha'
    };

    /**
     * Get the version as a string
     */
    function getVersion() {
        return `v${VERSION.number} (${VERSION.tag || 'release'})`;
    }

    /**
     * An event on the server
     */
    export class ServerEvent extends NetInternal.EventBase {

        /**
         * The RemoteEvent instance
         */
        public get instance() {
            return this._instance;
        }

        /**
         * The RBXScriptSignal for this RemoteEvent
         */
        public get event() {
            return this._instance.OnServerEvent;
        }

        /**
         * Connect a fucntion to fire when the event is invoked by the client
         * @param callback The function fired when the event is invoked by the client
         */
        public connect(callback: (...args: unknown[]) => void) {
            this.event.Connect(callback);
        }

        /**
         * Sends the specified arguments to all players
         * @param args The arguments to send to the players
         */
        public sendToAllPlayers(...args: unknown[]) {
            this._instance.FireAllClients(...args);
        }

        /**
         * Sends the specified arguments to a specified player
         * @param player The player
         * @param args The arguments to send to the player
         */
        public sendToPlayer(player: Player, ...args: unknown[]) {
            this._instance.FireClient(player, ...args);
        }

        /**
         * Sends the specified argumetns to the specified list of players
         * @param players The players
         * @param args The arugments to send to these players
         */
        public sendToPlayers(players: Player[], ...args: unknown[]) {
            players.forEach(player => this.sendToPlayer(player, ...args));
        }

        /**
         * Creates a new instance of a server event (Will also create the corresponding remote if it does not exist!)
         * @param name The name of this server event
         * @throws If not created on server
         */
        constructor(name: string) {
            super(name);
            assert(!IS_CLIENT, "Cannot create a Net.ServerEvent on the Client!");
        }
    }

    /**
     * A function on the server
     */
    export class ServerFunction extends NetInternal.FunctionBase {

        /**
         * The client cache in seconds
         */
        public get clientCache() {
            let cache = this._instance.FindFirstChild("Cache") as NumberValue;
            if (cache)
                return cache.Value;
            else
                return 0;
        }

        /**
         * The callback function
         */
        public get callback(): Callback {
            return this._instance.OnServerInvoke;
        }

        /**
         * Set the callback function when called by the client
         */
        public set callback(func: Callback) {
            this._instance.OnServerInvoke = func;
        }

        /**
         * The RemoteFunction instance
         */
        public get instance() {
            return this._instance;
        }

        /**
         * Sets a client cache timer in seconds
         * @param time seconds to cache on client
         */
        public set clientCache(time: number) {
            let cache = this._instance.FindFirstChild("Cache") as NumberValue;
            if (!cache) {
                let cacheTimer = new NumberValue(this._instance);
                cacheTimer.Value = time;
                cacheTimer.Name = "Cache";
            }
            else {
                cache.Value = time;
            }
        }

        /**
         * Calls the player and returns a promise
         * @async returns Promise
         * @param player The player to call the function on
         * @param args The arguments to call the function with
         */
        public async callPlayerAsync(player: Player, ...args: any[]): Promise<any> {
            return this._instance.InvokeClient(player, ...args);
        }

        /**
         * Creates a new instance of a server function (Will also create the corresponding remote if it does not exist!)
         * @param name The name of this server function
         * @throws If not created on server
         */
        constructor(name: string) {
            super(name);
            assert(!IS_CLIENT, "Cannot create a Net.ServerFunction on the Client!");
        }
    }


    /**
     * An event on the client
     */
    export class ClientEvent extends NetInternal.EventBase {

        /**
         * The RemoteEvent instance
         */
        public get instance() {
            return this._instance;
        }

        /**
         * The RBXScriptConnection
         */
        public get event() {
            return this._instance.OnClientEvent;
        }

        /**
         * Connect a function to fire when the event is invoked by the client
         * @param callback The function fired when the event is invoked by the client
         */
        public connect(callback: (...args: unknown[]) => void) {
            this.event.Connect(callback);
        }

        /**
         * Sends the specified arguments to the server
         * @param args The arguments to send to the server
         */
        public sendToServer(...args: unknown[]) {
            this._instance.FireServer(...args);
        }

        /**
         * Create a new instance of the ClientEvent
         * @param name The name of the client event
         * @throws If created on server, or does not exist.
         */
        constructor(name: string) {
            super(name);
            assert(IS_CLIENT, "Cannot create a Net.ClientEvent on the Server!");
            assert(EventExists(name), `The specified event '${name}' does not exist!`);
        }
    }

    /**
     * A function on the client
     */
    export class ClientFunction extends NetInternal.FunctionBase {
        private _lastPing = -1;
        private _cached: any = [];

        /**
         * The callback
         */
        public get callback(): Callback {
            return this._instance.OnClientInvoke;
        }

        /**
        * Set the callback function when called by the server
        */
        public set callback(func: Callback) {
            this._instance.OnClientInvoke = func;
        }

        /** 
         * The remoteFunction instance */
        public get instance() {
            return this._instance;
        }

        /**
         * The client cache in seconds
         */
        public get cache() {
            let cache = this._instance.FindFirstChild("Cache") as NumberValue;
            if (cache)
                return cache.Value;
            else
                return 0;
        }


        /**
         * Call the server with the specified arguments
         * @param args The arguments to call the server with
         * @returns the result of the call to the server
         */
        public callServer(...args: any[]): any {
            if (this._lastPing < (os.time() + this.cache)) {
                let results = [this._instance.InvokeServer(...args)];
                this._cached = results;

                this._lastPing = os.time();
                return [...results];
            }
            else
                return [...this._cached];
        }

        /**
         * Call the server with the specified arguments asynchronously
         * @param args The args to call the server with
         * @async Will return a promise
         */
        public async callServerAsync(...args: any[]): Promise<any> {
            return this.callServer(...args);
        }

        constructor(name: string) {
            super(name);
            assert(IS_CLIENT, "Cannot create a Net.ClientFunction on the Server!");
            assert(functionExists(name), `The specified function '${name}' does not exist!`);
        }
    }


    export function isClient() {
        return IS_CLIENT;
    }

    export function isServer() {
        return IS_SERVER;
    }

    /**
     * Create a function
     * @param name The name of the function
     * (Must be created on server)
     */
    export function createFunction(name: string): ServerFunction {
        if (IS_SERVER)
            return new ServerFunction(name);
        else
            throw "Net.createFunction can only be used on the server!";
    }

    /**
     * Create an event
     * @param name The name of the event
     * (Must be created on server)
     */
    export function createEvent(name: string): ServerEvent {
        if (IS_SERVER)
            return new ServerEvent(name);
        else
            throw "Net.createFunction can only be used on the server!";
    }

    export function getClientEventAsync(name: string): Promise<ClientEvent> {
        return new Promise((resolve, reject) => {
            if (EventExists(name)) {
                let newFunc = new ClientEvent(name);
                resolve(newFunc);
            }
            else {
                reject("Could not find Client Event: " + name + " (did you create it on the server?)");
            }
        });
    }

    export function getClientFunction(name: string): ClientFunction | undefined {
        if (functionExists(name))
            return new ClientFunction(name);
        else
            return undefined;
    }

    export function getServerEventAsync(name: string): Promise<ServerEvent> {
        return new Promise((resolve, reject) => {
            if (EventExists(name)) {
                let newFunc = new ServerEvent(name);
                resolve(newFunc);
            }
            else {
                reject("Could not find Server Event: " + name + " (did you create it on the server?)");
            }
        });
    }

    export function getClientFunctionAsync(name: string): Promise<ClientFunction> {
        return new Promise((resolve, reject) => {
            if (functionExists(name)) {
                let newFunc = new ClientFunction(name);
                resolve(newFunc);
            }
            else {
                reject("Could not find Client Function: " + name + " (did you create it on the server?)");
            }
        });
    }

    export function getServerFunctionAsync(name: string): Promise<ServerFunction> {
        return new Promise((resolve, reject) => {
            if (functionExists(name)) {
                let newFunc = new ServerFunction(name);
                resolve(newFunc);
            }
            else {
                reject("Could not find Server Function: " + name + " (did you create it?)");
            }
        });
    }

    if (IS_STUDIO)
        print("[rbx-net] Loaded rbx-net", getVersion());
}

export default Net;