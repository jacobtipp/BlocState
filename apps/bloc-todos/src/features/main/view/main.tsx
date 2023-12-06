import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppBlocObserver } from './app-bloc-observer';
import App from '../../app/view/app';
import { Bloc } from '@jacobtipp/bloc';
import { LocalStorageTodosClient } from '../../../packages/todos-client/local-storage-todos-client';
import { TodosRepository } from '../../../packages/todos-repository/todos-repository';
import {
  HydratedStorage,
  HydratedLocalStorage,
} from '@jacobtipp/hydrated-bloc';
import { StrictMode } from 'react';
import { QueryClient } from '@jacobtipp/bloc-query';

Bloc.observer = new AppBlocObserver();
HydratedStorage.storage = new HydratedLocalStorage();

const queryClient = new QueryClient();
const localStorageTodosClient = new LocalStorageTodosClient(queryClient);

const todosRepository = new TodosRepository(localStorageTodosClient);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <App todosRepository={todosRepository} />
    </BrowserRouter>
  </StrictMode>
);
