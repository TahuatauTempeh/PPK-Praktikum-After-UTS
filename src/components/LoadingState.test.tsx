import { render } from '@testing-library/react-native';

import { LoadingState } from './LoadingState';

describe('<LoadingState />', () => {
  it('menampilkan pesan default', async () => {
    const { getByText } = await render(<LoadingState />);

    expect(getByText('Memuat data...')).toBeTruthy();
  });

  it('menampilkan pesan yang diberikan', async () => {
    const { getByText } = await render(<LoadingState message="Memuat jadwal..." />);

    expect(getByText('Memuat jadwal...')).toBeTruthy();
  });
});
