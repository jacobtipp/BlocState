import { Observable, interval, take } from "rxjs";
import { BlocState, BlocEvent, Bloc } from "../lib";
import { delay } from "./counter/delay";

describe("emitter", () => {
  abstract class IntervalEvent extends BlocEvent {}
  class IntervalOnEachEvent extends IntervalEvent {}
  class IntervalForEachEvent extends IntervalEvent {}
  class IntervalNoEmitOnCloseEvent extends IntervalEvent {}

  class IntervalState extends BlocState<number> {}
  class IntervalBloc extends Bloc<IntervalEvent, IntervalState> {
    constructor(stream$: Observable<number>) {
      super(IntervalState.init());

      this.on(IntervalNoEmitOnCloseEvent, async (event, emit) => {
        await emit.forEach(stream$, (data) => {
          return IntervalState.ready(data);
        });
        emit.close();
        await delay(1000);
        emit(IntervalState.ready(10));
      });

      this.on(IntervalForEachEvent, async (event, emit) => {
        await emit.forEach(
          stream$,
          (data) => IntervalState.ready(data),
          (error) => IntervalState.failed(error)
        );
      });

      this.on(IntervalOnEachEvent, async (event, emit) => {
        await emit.onEach(
          stream$,
          (data) => emit(IntervalState.ready(data)),
          (error) => emit(IntervalState.failed(error))
        );
      });
    }
  }

  let interval$: Observable<number>;
  let intervalBloc: IntervalBloc;

  beforeEach(() => {
    interval$ = interval(1000).pipe(take(3));
    intervalBloc = new IntervalBloc(interval$);
  });

  describe("emitter.onEach", () => {
    it("should emit values from a stream", async () => {
      const states: number[] = [];
      intervalBloc.state$.subscribe({
        next: (state) => {
          if (state.payload.hasData) {
            states.push(state.payload.data);
          }
        },
        complete: () => {
          expect(states.length).toBe(3);
        },
      });

      intervalBloc.add(new IntervalOnEachEvent());
      await delay(5000);
      intervalBloc.close();
    }, 10000);

    it("should invoke onError if an error is thrown from onEach stream", async () => {
      const states: IntervalState[] = [];
      const errorStream$ = new Observable<number>((subscriber) => {
        subscriber.next(1);

        setTimeout(() => {
          subscriber.error(new Error("stream error"));
        }, 0);
      });

      let bloc = new IntervalBloc(errorStream$);

      bloc.state$.subscribe({
        next: (state) => {
          if (state.payload.hasData || state.payload.hasError) {
            states.push(state);
          }
        },
        complete: () => {
          const [a, b] = states;
          expect(states.length).toBe(2);
          expect(a.payload.data).toBe(1);
          expect(b.payload.error?.message).toBe("stream error");
        },
      });

      bloc.add(new IntervalOnEachEvent());
      await delay(3000);
      bloc.close();
    }, 10000);
  });

  describe("emitter.forEach", () => {
    it("should emit state returned from onData", async () => {
      const states: number[] = [];
      intervalBloc.state$.subscribe({
        next: (state) => {
          if (state.payload.hasData) {
            states.push(state.payload.data);
          }
        },
        complete: () => {
          expect(states.length).toBe(3);
        },
      });

      intervalBloc.add(new IntervalForEachEvent());
      await delay(5000);
      intervalBloc.close();
    }, 10000);

    it("should not emit after an emitter has been closed", async () => {
      const states: number[] = [];
      intervalBloc.state$.subscribe({
        next: (state) => {
          if (state.payload.hasData) {
            states.push(state.payload.data);
          }
        },
        complete: () => {
          expect(states.length).toBe(3);
        },
      });

      intervalBloc.add(new IntervalNoEmitOnCloseEvent());
      await delay(6000);
      intervalBloc.close();
    }, 10000);

    it("should emit state returned from onError when an error is thrown", async () => {
      const states: IntervalState[] = [];
      const errorStream$ = new Observable<number>((subscriber) => {
        subscriber.next(1);

        setTimeout(() => {
          subscriber.error(new Error("stream error"));
        }, 0);
      });

      let bloc = new IntervalBloc(errorStream$);

      bloc.state$.subscribe({
        next: (state) => {
          if (state.payload.hasData || state.payload.hasError) {
            states.push(state);
          }
        },
        complete: () => {
          const [a, b] = states;
          expect(states.length).toBe(2);
          expect(a.payload.data).toBe(1);
          expect(b.payload.error?.message).toBe("stream error");
        },
      });

      bloc.add(new IntervalForEachEvent());
      await delay(3000);
      bloc.close();
    }, 10000);
  });
});