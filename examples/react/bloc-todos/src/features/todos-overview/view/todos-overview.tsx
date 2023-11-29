import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  ListItemText,
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  Button,
  Snackbar,
  Container,
} from '@mui/material';
import Icon from '@mui/material/Icon';

import { useNavigate } from 'react-router-dom';
import { TodosOverviewOptionsButton } from '../components/todos-overview-options-button';
import { TodosOverviewFilterButton } from '../components/todos-overview-filter-button';
import { TodosOverviewEmptyText } from '../components/todos-overview-empty-text';
import { useMemo, useState } from 'react';
import { Todo } from '../../../packages/todos-client/model/todo';
import {
  BlocProvider,
  useBloc,
  useBlocListener,
  useRepository,
} from '@jacobtipp/react-bloc';
import { createSelector } from 'reselect';
import { TodosOverviewBloc } from '../bloc/todos-overview.bloc';
import {
  TodosOverviewSubscriptionRequested,
  TodosOverviewUndoDeletionRequested,
  TodosOverviewTodoDeleted,
  TodosOverviewTodoCompletionToggled,
} from '../bloc/todos-overview.event';
import { TodosOverviewState } from '../bloc/todos-overview.state';
import { TodosOverviewFilter } from '../model/todos-overview-filter';
import { TodosRepository } from '../../../packages/todos-repository/todos-repository';

const todoFilterMap = (todo: Todo, filter: TodosOverviewFilter) =>
  filter === 'all'
    ? true
    : filter === 'completed'
    ? todo.isCompleted
    : !todo.isCompleted;

// memoized selectors
const getData = (state: TodosOverviewState) => state.data;
const filterSelector = createSelector(getData, (data) => data.filter);
const todosSelector = createSelector(getData, (data) => data.todos);
const filteredTodosSelector = createSelector(
  [filterSelector, todosSelector],
  (filter, todos) => {
    return todos.filter((todo) => todoFilterMap(todo, filter));
  }
);

export default function TodosOverviewPage() {
  const todosRepository = useRepository(TodosRepository);

  return (
    <BlocProvider
      bloc={TodosOverviewBloc}
      create={() =>
        new TodosOverviewBloc(todosRepository).add(
          new TodosOverviewSubscriptionRequested()
        )
      }
    >
      <TodosOverviewView />
    </BlocProvider>
  );
}

export function TodosOverviewView() {
  const [isSnackbarOpen, openSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filteredTodos, { add }] = useBloc(TodosOverviewBloc, {
    selector: filteredTodosSelector,
  });

  const navigate = useNavigate();

  const handleCloseSnackbar = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    openSnackbar(false);
  };

  const action = useMemo(() => {
    return (
      <Button
        color="secondary"
        size="small"
        onClick={(e) => {
          handleCloseSnackbar(e);
          add(new TodosOverviewUndoDeletionRequested());
        }}
      >
        UNDO
      </Button>
    );
  }, [add]);

  useBlocListener(TodosOverviewBloc, {
    listenWhen(previous, current) {
      return (
        previous.data.lastDeletedTodo !== current.data.lastDeletedTodo &&
        current.data.lastDeletedTodo !== undefined
      );
    },
    listener(_bloc, state) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const deletedTodo = state.data.lastDeletedTodo!;
      setSnackbarMessage(`Todo "${deletedTodo.title}" deleted.`);
      openSnackbar(false); // close snackbar if already open
      openSnackbar(true); // open snackbar
    },
  });

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bloc Todos
          </Typography>
          <TodosOverviewFilterButton />
          <TodosOverviewOptionsButton />
        </Toolbar>
      </AppBar>
      <Container>
        {filteredTodos.length > 0 ? (
          <List sx={{ paddingY: (theme) => theme.spacing(8) }}>
            {filteredTodos.map((todo) => {
              const labelId = `checkbox-list-label-${todo.id}`;
              return (
                <ListItem
                  key={todo.id}
                  secondaryAction={
                    <IconButton
                      color="inherit"
                      edge="end"
                      aria-label="delete"
                      onClick={() => add(new TodosOverviewTodoDeleted(todo))}
                    >
                      <Icon>delete</Icon>
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton role={undefined}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={todo.isCompleted}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': labelId }}
                        onClick={() =>
                          add(
                            new TodosOverviewTodoCompletionToggled(
                              todo,
                              !todo.isCompleted
                            )
                          )
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={labelId}
                      primary={todo.title}
                      sx={{
                        textDecoration: todo.isCompleted ? 'line-through' : '',
                      }}
                      onClick={() => navigate(`/edit/${todo.id}`)}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <TodosOverviewEmptyText />
        )}
      </Container>
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={action}
        sx={{ bottom: { xs: 100, sm: 100 } }}
      />
    </>
  );
}