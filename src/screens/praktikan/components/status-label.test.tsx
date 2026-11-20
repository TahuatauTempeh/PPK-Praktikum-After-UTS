import { render } from '@testing-library/react-native';

import type { SessionStatus } from '@/types';

import { StatusLabel } from './status-label';

describe('<StatusLabel />', () => {
  it.each<[SessionStatus, string]>([
    ['scheduled', 'Belum dibuka'],
    ['open', 'Dibuka'],
    ['closed', 'Ditutup'],
  ])('menampilkan teks status %s', async (status, label) => {
    const { getByText } = await render(<StatusLabel status={status} />);

    expect(getByText(label)).toBeTruthy();
  });
});
