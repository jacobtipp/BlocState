/* eslint-disable @typescript-eslint/no-explicit-any */

import { Bloc, BlocBase, Transition } from '.';
import { Change } from './';

const isServer = typeof window === 'undefined';

/**
 * Defines methods to observe the state changes of a Bloc.
 */
export class BlocObserver {
  private static _observer = new BlocObserver();

  static get observer() {
    return BlocObserver._observer;
  }

  static set observer(toObserve: BlocObserver) {
    /* istanbul ignore next */
    if (isServer) return;
    BlocObserver._observer = toObserve;
  }
  /**
   * Called when a new Bloc is created.
   * @param _bloc The newly created Bloc object.
   */
  onCreate(_bloc: BlocBase<any>, _initialState: any): void {
    return;
  }

  /**
   * Called when an event is added to a Bloc.
   * @param _bloc The Bloc object that received the event.
   * @param _event The event that was added.
   */
  onEvent(_bloc: Bloc<any, any>, _event: any): void {
    return;
  }

  /**
   * Called when a transition occurs in a Bloc.
   * @param _bloc The Bloc object where the transition occurred.
   * @param _transition The transition object that was made.
   */
  onTransition(_bloc: Bloc<any, any>, _transition: Transition<any, any>): void {
    return;
  }

  /**
   * Called when an error occurs during the execution of a Bloc.
   * @param _bloc The Bloc object where the error occurred.
   * @param _error The error object that was thrown.
   */
  onError(_bloc: BlocBase<any>, _error: Error): void {
    return;
  }

  /**
   * Called when a change occurs in the state of a Bloc.
   * @param _bloc The Bloc object whose state changed.
   * @param _change The change object that describes the state change.
   */
  onChange(_bloc: BlocBase<any>, _change: Change<any>) {
    return;
  }

  /**
   * Called when a Bloc object is closed and its state is cleared.
   * @param _bloc The Bloc object that was closed.
   */
  onClose(_bloc: BlocBase<any>): void {
    return;
  }
}
