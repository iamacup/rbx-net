import { NetMiddleware, NextCaller } from "../middleware";
import { ifEnv } from "rbxts-transform-env";
import { DebugLog } from "../configuration";

export type MiddlewareList = ReadonlyArray<NetMiddleware<ReadonlyArray<unknown>>>;
abstract class MiddlewareEvent {
	protected constructor(private readonly middlewares: MiddlewareList = []) {}
	abstract GetInstance(): RemoteEvent;
	protected _processMiddleware<A extends ReadonlyArray<unknown>, R = void>(
		callback: (player: Player, ...args: A) => R,
	) {
		const { middlewares } = this;
		try {
			if (middlewares.size() > 0) {
				ifEnv("NODE_ENV", "development", () => {
					DebugLog(`${this.GetInstance().GetFullName()} created with ${middlewares.size()} middleware(s).`);
				});

				let callbackFn = callback as NextCaller<R>;

				// Run through each middleware
				for (const middleware of middlewares) {
					callbackFn = middleware(callbackFn, this) as NextCaller<R>;
				}

				return callbackFn;
			} else {
				return callback;
			}
		} catch (e) {
			warn("[rbx-net] " + tostring(e));
		}
	}
}

export default MiddlewareEvent;
