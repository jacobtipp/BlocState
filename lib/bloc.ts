import {
  EMPTY,
  from,
  Observable,
  Subject,
  Subscription,
  catchError,
  shareReplay,
  map,
  distinctUntilChanged,
  filter,
} from "rxjs";
import { BlocBase } from "./base";
import { BlocObserver } from "./bloc-observer";
import { BlocEvent } from "./event";
import { BlocState } from "./state";
import { concurrent } from "./transformer";
import { Transition } from "./transition";
import {
  BlocDataType,
  EmitUpdaterCallback,
  EventHandler,
  ClassType,
  BlocSelectorConfig,
  EventTransformer,
  Emitter,
} from "./types";

export abstract class Bloc<
  Event extends BlocEvent,
  State extends BlocState<any>
> extends BlocBase<State> {
  constructor(state: State) {
    super(state);
  }

  readonly #eventSubject$ = new Subject<Event>();

  readonly #eventMap = new Map<string, null>();

  readonly #subscriptions: Subscription[] = [];

  #emitters: Emitter<State>[] = [];

  #mapEventToStateError(error: Error): Observable<never> {
    this.onError(error);
    return EMPTY;
  }

  protected override onError(error: Error): void {
    Bloc.observer.onError(this, error);
  }

  protected onTransition(transition: Transition<Event, State>): void {
    Bloc.observer.onTransition(this, transition);
  }

  protected onEvent(event: Event): void {
    Bloc.observer.onEvent(this, event);
  }

  protected on<T extends Event>(
    event: ClassType<T>,
    eventHandler: EventHandler<T, State>,
    transformer: EventTransformer<T> = Bloc.transformer
  ) {
    if (this.#eventMap.has(event.name)) {
      throw new Error(`${event.name} can only have one EventHandler`);
    }

    this.#eventMap.set(event.name, null);

    const mapEventToState = (event: T): Observable<void> => {
      const stateToBeEmittedStream$ = new Subject<State>();
      let disposables: Subscription[] = [];
      let isClosed = false;

      const emitter: Emitter<State> = (newState: State | EmitUpdaterCallback<State>): void => {
        if (isClosed) {
          return;
        }

        let stateToBeEmitted: State | undefined;

        if (typeof newState === "function") {
          let callback = newState as EmitUpdaterCallback<State>;
          stateToBeEmitted = callback(this.state);
        } else {
          stateToBeEmitted = newState;
        }

        if (stateToBeEmitted !== undefined) {
          this.onTransition(new Transition(this.state, event, stateToBeEmitted));
          stateToBeEmittedStream$.next(stateToBeEmitted);
        }
      };

      emitter.onEach = (stream$, onData, onError) => {
        return new Promise((resolve) => {
          const subscription = stream$.subscribe({
            next: onData,
            error: (error) => {
              if (onError != null && error != null) {
                onError(error);
              }
              resolve();
            },
            complete: () => {
              resolve();
            },
          });

          disposables.push(subscription);
        });
      };

      emitter.forEach = (stream$, onData, onError) => {
        return emitter.onEach(
          stream$,
          (data) => emitter(onData(data)),
          onError ? (error: any) => emitter(onError(error)) : undefined
        );
      };

      emitter.close = () => {
        isClosed = true;
        stateToBeEmittedStream$.complete();
        for (const sub of disposables) {
          sub.unsubscribe();
        }
        disposables = [];
        this.#emitters = this.#emitters.filter((emit) => emit !== emitter);
      };

      this.#emitters.push(emitter);

      return new Observable((subscriber) => {
        stateToBeEmittedStream$.subscribe(this.emit);

        const result = eventHandler(event, emitter);

        if (result instanceof Promise) {
          from(result).subscribe({
            complete: () => subscriber.complete(),
          });
        } else {
          subscriber.complete();
        }

        return () => {
          emitter.close();
        };
      });
    };

    const transformStream$ = transformer(
      this.#eventSubject$.pipe(filter((newEvent): newEvent is T => newEvent instanceof event)),
      mapEventToState
    );

    const subscription = transformStream$
      .pipe(catchError((error: Error) => this.#mapEventToStateError(error)))
      .subscribe();

    this.#subscriptions.push(subscription);
  }

  static transformer: EventTransformer<any> = concurrent();

  static observer: BlocObserver = new BlocObserver();

  add(event: Event): void {
    if (!this.#eventSubject$.closed) {
      try {
        this.onEvent(event);
        this.#eventSubject$.next(event);
      } catch (error) {
        this.onError(error);
      }
    }
  }

  filterType<T extends State>(type: ClassType<T>): Observable<T> {
    const typePredicate = (state: State): state is T => state instanceof type;
    return this.state$.pipe(filter(typePredicate));
  }

  filter<T extends State>(stateFilter: (state: T) => boolean, type?: ClassType<T>): Observable<T> {
    if (type) {
      const typePredicate = (state: State): state is T => state instanceof type;
      return this.state$.pipe(filter(typePredicate), filter(stateFilter));
    } else {
      return this.state$.pipe(filter(stateFilter));
    }
  }

  override select<K, T extends State = State>(
    config: BlocSelectorConfig<T, K> | ((state: BlocDataType<T>) => K),
    type?: ClassType<T>
  ): Observable<K> {
    let stream$: Observable<K> = EMPTY;
    const typePredicate = type ? (state: T): state is T => state instanceof type : () => true;
    if ("selector" in config) {
      const dataFilter = config.filter ?? (() => true);
      stream$ = this.state$.pipe(
        filter((state) => state.payload.hasData), // only filter state that has data
        filter(typePredicate),
        map((state) => state.payload.data), // select only data
        map(config.selector),
        filter(dataFilter)
      );
    } else if (typeof config === "function") {
      stream$ = this.state$.pipe(
        filter((state) => state.payload.hasData), // only filter state that has data
        filter(typePredicate),
        map((state) => state.payload.data), // select only data
        map(config)
      );
    }

    return stream$.pipe(distinctUntilChanged(), shareReplay({ refCount: true, bufferSize: 1 }));
  }

  override close(): void {
    for (const emitter of this.#emitters) {
      emitter.close();
    }

    for (const sub of this.#subscriptions) {
      sub.unsubscribe();
    }

    super.close();
  }
}
