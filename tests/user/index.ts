import { Bloc } from "../../lib/bloc";
import { BlocEvent } from "../../lib/event";
import { BlocState } from "../../lib/state";
import {} from "../../lib/types";

export interface User {
  name: {
    first: string;
    last: string;
  };
  age: number;
}

export class UserState extends BlocState<User> {}

export class UserEvent extends BlocEvent {}

export class UserNameChangedEvent extends UserEvent {
  constructor(public name: { first: string; last: string }) {
    super();
  }
}

export class UserAgeChangedEvent extends UserEvent {
  constructor(public age: number) {
    super();
  }
}

export class UserBloc extends Bloc<UserEvent, UserState> {
  constructor() {
    super(
      UserState.init({
        name: {
          first: "",
          last: "",
        },
        age: 0,
      })
    );

    this.on(UserNameChangedEvent, (event, emit) => {
      emit((current) => {
        if (current.payload.hasData) {
          const data = current.payload.data;
          return UserState.ready({ ...data, name: event.name });
        }
      });
    });

    this.on(UserAgeChangedEvent, (event, emit) => {
      emit((current) => {
        if (current.payload.hasData) {
          const data = current.payload.data;
          return UserState.ready({ ...data, age: data.age + 1 });
        }
      });
    });
  }

  name$ = this.select((data) => data.name);

  age$ = this.select((data) => data.age);
}
