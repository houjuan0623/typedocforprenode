import { insertOrderSorted } from "./array";

const momentos = new WeakMap<
    EventHooksMomento<never, unknown>,
    Map<any, { listener: (..._: any) => any; once?: boolean; order: number }[]>
>();

type EventHooksMomento<T extends Record<keyof T, unknown[]>, _R> = {
    __eventHooksMomentoBrand: never;
};

/**
 * Event emitter which allows listeners to return a value.
 *
 * This is beneficial for the themes since it allows plugins to modify the HTML output
 * without doing unsafe text replacement.
 *
 * Very simple event emitter class which collects the return values of its listeners.
 *
 * @example
 * ```ts
 * const x = new EventHooks<{ a: [string] }, string>()
 * x.on('a', a => a.repeat(123)) // ok, returns a string
 * x.on('b', console.log) // error, 'b' is not assignable to 'a'
 * x.on('a' a => 1) // error, returns a number but expected a string
 * ```
 */
export class EventHooks<T extends Record<keyof T, unknown[]>, R> {
    // Function is *usually* not a good type to use, but here it lets us specify stricter
    // contracts in the methods while not casting everywhere this is used.
    private _listeners = new Map<
        keyof T,
        { listener: (..._: any) => any; once?: boolean; order: number }[]
    >();

    /**
     * Starts listening to an event.
     * @param event the event to listen to.
     * @param listener function to be called when an this event is emitted.
     * @param order optional order to insert this hook with.
     */
    on<K extends keyof T>(
        event: K,
        listener: (...args: T[K]) => R,
        order = 0,
    ): void {
        const list = (this._listeners.get(event) || []).slice();
        insertOrderSorted(list, { listener, order });
        this._listeners.set(event, list);
    }

    /**
     * Listens to a single occurrence of an event.
     * @param event the event to listen to.
     * @param listener function to be called when an this event is emitted.
     * @param order optional order to insert this hook with.
     */
    once<K extends keyof T>(
        event: K,
        listener: (...args: T[K]) => R,
        order = 0,
    ): void {
        const list = (this._listeners.get(event) || []).slice();
        insertOrderSorted(list, { listener, once: true, order });
        this._listeners.set(event, list);
    }

    /**
     * Stops listening to an event.
     * @param event the event to stop listening to.
     * @param listener the function to remove from the listener array.
     */
    off<K extends keyof T>(event: K, listener: (...args: T[K]) => R): void {
        const listeners = this._listeners.get(event);
        if (listeners) {
            const index = listeners.findIndex((lo) => lo.listener === listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emits an event to all currently subscribed listeners.
     * @param event the event to emit.
     * @param args any arguments required for the event.
     */
    emit<K extends keyof T>(event: K, ...args: T[K]): R[] {
        const listeners = this._listeners.get(event)?.slice() || [];
        this._listeners.set(
            event,
            listeners.filter(({ once }) => !once),
        );
        return listeners.map(({ listener }) => listener(...args));
    }

    saveMomento(): EventHooksMomento<T, R> {
        const momento = {} as EventHooksMomento<T, R>;
        const save = new Map<
            keyof T,
            { listener: (..._: any) => any; once?: boolean; order: number }[]
        >();

        for (const [key, val] of this._listeners) {
            save.set(key, [...val]);
        }

        momentos.set(momento, save);
        return momento;
    }

    restoreMomento(momento: EventHooksMomento<T, R>): void {
        const saved = momentos.get(momento);
        if (saved) {
            this._listeners.clear();
            for (const [key, val] of saved) {
                this._listeners.set(key, [...val]);
            }
        } else {
            throw new Error("Momento not found.");
        }
    }
}
