import ServerAsyncFunction from "../server/ServerAsyncFunction";
import ServerEvent from "../server/ServerEvent";
import ServerFunction from "../server/ServerFunction";
import {
	AsyncFunctionDeclarationLike,
	EventDeclarationLike,
	FunctionDeclarationLike,
	InferServerConnect,
	InferServerRemote,
	RemoteDeclarations,
} from "./Types";
import { DeclarationsOf } from "./CreateDefinitions";

export class ServerDefinitionBuilder<T extends RemoteDeclarations> {
	public constructor(private decl: T) {}
	/**
	 * Create a receive-only event for the server.
	 *
	 * @param name The name
	 * @param fn The callback
	 *
	 * Shortcut for:
	 * ```ts
	 * Declaration.CreateServer(name).Connect(fn)
	 * ```
	 */
	ConnectEvent<K extends keyof DeclarationsOf<T, EventDeclarationLike> & string>(
		name: K,
		fn: InferServerConnect<Extract<T[K], EventDeclarationLike>>,
	) {
		const result = this.Create(name) as InferServerRemote<EventDeclarationLike>;
		result.Connect(fn);
	}

	/**
	 * Creates a server remote from a declaration
	 */
	Create<K extends keyof T & string>(k: K): InferServerRemote<T[K]> {
		const item = this.decl[k] as FunctionDeclarationLike | AsyncFunctionDeclarationLike | EventDeclarationLike;
		if (item.Type === "Function") {
			if (item.ServerMiddleware) {
				return new ServerFunction(k, item.ServerMiddleware) as InferServerRemote<T[K]>;
			} else {
				return new ServerFunction(k) as InferServerRemote<T[K]>;
			}
		} else if (item.Type === "AsyncFunction") {
			if (item.ServerMiddleware) {
				return new ServerAsyncFunction(k, item.ServerMiddleware) as InferServerRemote<T[K]>;
			} else {
				return new ServerAsyncFunction(k) as InferServerRemote<T[K]>;
			}
		} else if (item.Type === "Event") {
			if (item.ServerMiddleware) {
				return new ServerEvent(k, item.ServerMiddleware) as InferServerRemote<T[K]>;
			} else {
				return new ServerEvent(k) as InferServerRemote<T[K]>;
			}
		}

		throw `Invalid Type`;
	}
}
