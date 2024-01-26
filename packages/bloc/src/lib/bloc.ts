import { filter, mergeMap, Observable, Subject } from 'rxjs';

import { BlocBase } from './base';
import { BlocObserver } from './bloc-observer';
import { Emitter, EmitterImpl } from './emitter';
import { StateError } from './errors';
import { Transition } from './transition';
import { ClassType } from './types';

/**
 * EventHandler that takes an event and emits state changes.
 *
 * @template E - The generic type of the event.
 * @template S - The generic type of the state.
 */
export type EventHandler<E, S> = (
  event: InstanceType<ClassType<E>>,
  emitter: Emitter<S>
) => void | Promise<void>;

/**
 * A function that maps an event to an observable sequence of events.
 *
 * @template Event - The generic type of the event sequence being transformed.
 */
export type EventMapper<Event> = (event: Event) => Observable<Event>;

/**
 * A function that takes an observable sequence of events and a mapper and returns the transformed observable sequence of events.
 *
 * @template Event - The generic type of the event sequence being transformed.
 */
export type EventTransformer<Event> = (
  events$: Observable<Event>,
  mapper: EventMapper<Event>
) => Observable<Event>;

/**
 * An abstract class representing a BLoC.
 *
 * @template Event - The generic type of the event.
 * @template State - The generic type of the state.
 */
export abstract class Bloc<Event, State> extends BlocBase<State> {
  /**
   * Creates a new instance of the Bloc class.
   *
   * @param state - The initial state of the BLoC.
   */
  constructor(state: State, name?: string) {
    super(state, name);
    this.on = this.on.bind(this);
    this.add = this.add.bind(this);
    this.emit = this.emit.bind(this);
  }

  /** An observable stream of BLoC events. */
  private readonly _eventSubject$ = new Subject<Event>();

  /** A mapping of registered events to their corresponding handler. */
  private readonly _eventMap = new WeakMap<ClassType<Event>, 1>();

  /** A set of emitters for the state. */
  private readonly _emitters = new Set<EmitterImpl<State>>();

  /** Indicates whether this is an instance of Bloc. */
  readonly isBlocInstance = true;

  /** This should only be used by devtools as signal to prevent BlocListeners from performing side-effects during time travel */
  static ignoreListeners = false;

  /**
   * Returns an event transformer.
   *
   * @template T - The generic type of the input and output event sequence.
   */
  static transformer<T>(): EventTransformer<T> {
    return (events$, mapper) => events$.pipe(mergeMap(mapper));
  }

  /**
   * Handles errors that occur during the BLoC's lifecycle.
   *
   * @param error - The error that occurred.
   */
  protected override onError(error: Error): void {
    BlocObserver.observer.onError(this, error);
  }

  /**
   * Handles transitions between BLoC states.
   *
   * @param transition - The transition that occurred.
   */
  protected onTransition(transition: Transition<Event, State>): void {
    BlocObserver.observer.onTransition(this, transition);
  }

  /**
   * Handles BLoC events.
   *
   * @param event - The event that occurred.
   */
  protected onEvent(event: Event): void {
    BlocObserver.observer.onEvent(this, event);
  }

  /**
   * Registers an event handler for a given event.
   *
   * @param event - The event to register the handler for.
   * @param eventHandler - The handler function.
   * @param transformer - An optional event transformer to use. If none is provided, a default transformer will be used.
   *
   * @throws if there is already an event handler registered for the given event.
   */
  protected on<T extends Event>(
    event: ClassType<T>,
    eventHandler: EventHandler<T, State>,
    transformer?: EventTransformer<T>
  ): void {
    if (this._eventMap.has(event)) {
      throw new Error(`${event.name} can only have one EventHandler`);
    }

    this._eventMap.set(event, 1);

    const mapEventToState = (event: T): Observable<T> => {
      const stateToBeEmittedStream$ = new Subject<State>();
      let isClosed = false;

      const onEmit = (nextState: State): void => {
        if (isClosed) {
          return;
        }

        if (this.state === nextState && this._emitted) return;

        try {
          const previous = this.state;
          this.onTransition(new Transition(previous, event, nextState));
          stateToBeEmittedStream$.next(nextState);
        } catch (error) {
          this.onError(error as Error);
          throw error;
        }
      };

      const emitter = new EmitterImpl(onEmit.bind(this));

      const callableEmitter = ((state: State) =>
        emitter.call(state)) as Emitter<State>;

      Object.defineProperty<typeof callableEmitter>(
        callableEmitter,
        'isClosed',
        {
          get: () => {
            return isClosed;
          },
        }
      );

      callableEmitter.onEach = <T>(
        stream$: Observable<T>,
        onData: (data: T) => void,
        onError?: (error: Error) => void
      ) => emitter.onEach(stream$, onData, onError);

      callableEmitter.forEach = <T>(
        stream$: Observable<T>,
        onData: (data: T) => State,
        onError?: (error: Error) => State
      ) => emitter.forEach(stream$, onData, onError);

      const handleEvent = async () => {
        try {
          this._emitters.add(emitter);
          await eventHandler.call(this, event, callableEmitter);
        } catch (err) {
          this.onError(err as Error);
          throw err;
        }
      };

      return new Observable<T>((subscriber) => {
        stateToBeEmittedStream$.subscribe(this.emit);

        handleEvent()
          .then(() => subscriber.complete())
          .catch((error) => subscriber.error(error));

        return () => {
          isClosed = true;
          emitter.close();
          this._emitters.delete(emitter);
          stateToBeEmittedStream$.complete();
        };
      });
    };

    const _transformer = transformer ?? Bloc.transformer();

    const transformStream$ = _transformer(
      this._eventSubject$.pipe(
        filter((newEvent): newEvent is T => newEvent instanceof event)
      ),
      mapEventToState
    );

    const subscription = transformStream$.subscribe();

    this.subscriptions.add(subscription);
  }

  /**
   * Adds an event to the BLoC's stream of events.
   *
   * @param event - The event to add.
   *
   * @throws if there is no registered event handler for the given event.
   *
   * @returns The instance of the Bloc.
   */
  add(event: Event) {
    if (!this._eventMap.has(Object.getPrototypeOf(event).constructor)) {
      throw new StateError(`
        add(${event}) was called without a registered event handler.
        Make sure to register a handler via on(${event}, (event, emit) {...})
      `);
    }

    try {
      this.onEvent(event);
      this._eventSubject$.next(event);
    } catch (error) {
      this.onError(error as Error);
      throw error;
    }

    return this;
  }

  /** Closes all the emitters */
  override close(): void {
    this._emitters.forEach((emitter) => emitter.close());
    this._emitters.clear();
    this._eventSubject$.complete();
    super.close();
  }
}

/**
 * Type guard for Bloc objects.
 *
 * @param bloc - The object to check if it's a Bloc.
 *
 * @returns True if the object is a Bloc or has an isBlocInstance property, false otherwise.
 */
export const isBlocInstance = (bloc: any): bloc is Bloc<any, any> => {
  return bloc instanceof Bloc || Boolean(bloc.isBlocInstance);
};
