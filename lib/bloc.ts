import { defer, EMPTY, from, iif, Observable, of, Subject } from "rxjs";
import { catchError, concatMap, mergeMap, tap } from "rxjs/operators";
import { Cubit } from "./cubit";

export type Emitter <S> = (state: S) => void
export type EventMapFunction <E, S> = (event: E, emitter: Emitter<S> ) => void | Promise<void>
export type EventClass <E> = { new (): E }

export abstract class Bloc<Event extends {}, State> extends Cubit<State> {
  private readonly _events$ = new Subject<Event>();
  private readonly _eventMap = new Map<string, EventMapFunction<any, State>>()

  private _event: Event | undefined;

  constructor(state: State) {
    super(state);
    this._subscribeToEvents();
  }

  protected on<E>(c: EventClass<E>, callback: EventMapFunction<E, State>) {
    this._eventMap.set(c.name, callback.bind(this))
  }

  protected get state(): State {
    return this._state;
  }

  addEvent(event: Event): void {
    if (!this._events$.closed) {
      this._events$.next(event);
    }
  }

  protected onTransition(current: State, next: State, event?: Event): void { }

  protected onError(error: Error): void { }

  protected onEvent(event: Event): void { }


  protected onChange(current: State, next: State): void {
      this.onTransition(current, next, this._event)
  }

  protected transformEvents(events$: Observable<Event>, next: (event: Event) => Observable<void>) {
    return events$.pipe(concatMap(next))
  }

  private _subscribeToEvents(): void {
    this._events$
      .pipe(
        tap((event) => this.onEvent(event)),
        tap((event) => this._event = event),
        mergeMap((event) => {
          return this.transformEvents(of(event), this._mapEventToState.bind(this))
        }),
        catchError((error: Error) => this._mapEventToStateError(error)),
      )
      .subscribe();
  }


  private _mapEventToState(event: Event): Observable<void> {
    let eventFunction = this._eventMap.get(event.constructor.name)
    if (eventFunction === undefined) {
      return EMPTY
    }

    let result = eventFunction(event, this.emit.bind(this))

    return result instanceof Promise ? from(result) : EMPTY
  }

  private _mapEventToStateError(error: Error): Observable<never> {
    this.onError(error);
    return EMPTY;
  }

  private _dispose(): void {
    this._events$.complete();
    this._eventMap.clear()
    super.dispose();
  }

  close(): void {
    this._dispose();
  }
}
