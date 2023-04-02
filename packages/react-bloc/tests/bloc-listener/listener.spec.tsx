import { cleanup, render, waitFor, screen } from '@testing-library/react';
import { UserSingleBlocListenerProvider } from '../test-helpers';
import { globalContext } from '../../src/lib/context/bloc-context';

describe('BlocListener', () => {
  afterEach(() => {
    cleanup();
    globalContext.clear();
  });

  it('should listen to states when single bloc listener', async () => {
    expect.assertions(1);
    render(<UserSingleBlocListenerProvider />);

    await waitFor(
      () => {
        screen.getByText('bloc-listener');
      },
      {
        timeout: 3000,
      }
    );

    expect(screen.getByTestId('test-name').textContent).toBe('bloc-listener');
  });
});
