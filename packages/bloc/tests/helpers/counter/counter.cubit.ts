import { Cubit } from '../../../src';
import { delay } from '../delay';

export class CounterCubit extends Cubit<number> {
  increment() {
    this.emit(this.state + 1);
  }

  async asyncIncrement() {
    this.emit(this.state + 1);
    this.emit(this.state - 1);
    await delay(3000);
    this.emit(this.state + 1);
  }
}
