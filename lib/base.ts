import {
  BehaviorSubject,
  Observable,
  Subscription,
  distinctUntilChanged,
  shareReplay,
  map,
  share,
  Subject,
} from "rxjs";
import { BlocState } from "./state";
import { EmitUpdaterCallback } from "./types";

export abstract class BlocBase<State extends BlocState<any>> {
  constructor(private _state: State) {
    this.emit = this.emit.bind(this);
    this._stateSubject$ = new BehaviorSubject(_state);
    this.state$ = this._buildStatePipeline();
    this._stateSubscription = this._subscribeStateoState();
  }

  /**
   * @returns the last emitted state in a cubit
   */
  get state(): State {
    return this._state;
  }

  private readonly _stateSubject$: BehaviorSubject<State>;

  /**
   * emits state pushed into a cubit
   */
  readonly state$: Observable<State>;

  private readonly _stateSubscription: Subscription;

  private _subscribeStateoState(): Subscription {
    return this.state$.subscribe({
      next: (state) => this.listen(state),
      error: (error) => this.onError(error),
    });
  }

  private _buildStatePipeline(): Observable<State> {
    return this._stateSubject$
      .asObservable()
      .pipe(distinctUntilChanged(), shareReplay({ refCount: true, bufferSize: 1 }));
  }

  protected listen(state: State): void {
    return;
  }

  /**
   * @override
   * @param error
   */
  protected onError(error: Error): void {}

  /**
   *
   * @param newState new state to be emitted
   * @returns void
   */
  public emit(newState: State | EmitUpdaterCallback<State>): void {
    if (this._stateSubject$.closed) {
      return;
    }

    let stateToBeEmitted: State;

    if (typeof newState === "function") {
      let callback = newState as EmitUpdaterCallback<State>;
      stateToBeEmitted = callback(this.state);
    } else {
      stateToBeEmitted = newState;
    }

    if (this._state !== stateToBeEmitted) {
      this.onChange(this._state, stateToBeEmitted);
      this._state = stateToBeEmitted;
      this._stateSubject$.next(stateToBeEmitted);
    }
  }

  /**
   * @override
   * @param current State
   * @param next State
   */
  protected onChange(current: State, next: State): void {}

  /**
   *
   * @param mapState (state: State) => K
   * @returns new mapped selected state
   */
  public select<K>(mapState: (state: State) => K): Observable<K> {
    return this.state$.pipe(
      map((state) => mapState(state)),
      distinctUntilChanged(),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  close() {
    this.dispose();
  }

  private dispose(): void {
    this._stateSubject$.complete();
    this._stateSubscription.unsubscribe();
  }
}
