import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Implementasi Android diimpor langsung; Jest memakai platform iOS sebagai default.
import { TimeFieldDialog as TimeField } from './time-field-dialog';
import { dateKeJam, jamKeDate, jamValid, tampilJam } from './time-field-utils';

type PickerProps = {
  value: Date;
  is24Hour?: boolean;
  onValueChange: (event: unknown, date: Date) => void;
  onDismiss: () => void;
};

let pickerTerakhir: PickerProps | null = null;

jest.mock('@expo/ui/community/datetime-picker', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    DateTimePicker: (props: PickerProps) => {
      pickerTerakhir = props;
      return <Text>dialog jam</Text>;
    },
  };
});

beforeEach(() => {
  pickerTerakhir = null;
});

describe('konversi jam', () => {
  it('mengubah "HH:mm" menjadi Date pada tanggal dasar dan kembali lagi', () => {
    const tanggal = jamKeDate('13:45', new Date(2026, 10, 23, 9, 0));
    expect(tanggal.getFullYear()).toBe(2026);
    expect(tanggal.getHours()).toBe(13);
    expect(tanggal.getMinutes()).toBe(45);
    expect(dateKeJam(tanggal)).toBe('13:45');
  });

  it('memakai 08.00 untuk jam yang tidak valid', () => {
    expect(dateKeJam(jamKeDate('25:99'))).toBe('08:00');
    expect(dateKeJam(jamKeDate(''))).toBe('08:00');
  });

  it('menambah nol di depan jam satu digit', () => {
    expect(dateKeJam(new Date(2026, 0, 1, 7, 5))).toBe('07:05');
  });

  it('mengenali jam 24 jam yang valid', () => {
    expect(jamValid('00:00')).toBe(true);
    expect(jamValid('23:59')).toBe(true);
    expect(jamValid('24:00')).toBe(false);
    expect(jamValid('8:00')).toBe(false);
    expect(jamValid('')).toBe(false);
  });

  it('menampilkan jam dengan titik', () => {
    expect(tampilJam('08:30')).toBe('08.30');
  });
});

describe('<TimeField /> Android', () => {
  it('menampilkan jam dan membuka dialog 24 jam saat diketuk', async () => {
    const { getByText, queryByText, getByLabelText } = await render(
      <TimeField value="10:00" onChange={jest.fn()} accessibilityLabel="Jam Mulai" />
    );

    expect(getByText('10.00')).toBeTruthy();
    expect(queryByText('dialog jam')).toBeNull();

    await fireEvent.press(getByLabelText('Jam Mulai, 10.00'));
    expect(getByText('dialog jam')).toBeTruthy();
    expect(pickerTerakhir?.is24Hour).toBe(true);
    expect(dateKeJam(pickerTerakhir!.value)).toBe('10:00');
  });

  it('mengirim jam "HH:mm" yang dipilih lalu menutup dialog', async () => {
    const onChange = jest.fn();
    const { getByLabelText, queryByText } = await render(
      <TimeField value="10:00" onChange={onChange} accessibilityLabel="Jam Selesai" />
    );

    await fireEvent.press(getByLabelText('Jam Selesai, 10.00'));
    await act(async () => pickerTerakhir!.onValueChange({}, new Date(2026, 10, 23, 11, 40)));

    expect(onChange).toHaveBeenCalledWith('11:40');
    expect(queryByText('dialog jam')).toBeNull();
  });

  it('tidak mengubah jam saat dialog dibatalkan', async () => {
    const onChange = jest.fn();
    const { getByLabelText, queryByText } = await render(
      <TimeField value="10:00" onChange={onChange} accessibilityLabel="Jam Mulai" />
    );

    await fireEvent.press(getByLabelText('Jam Mulai, 10.00'));
    await act(async () => pickerTerakhir!.onDismiss());

    expect(onChange).not.toHaveBeenCalled();
    expect(queryByText('dialog jam')).toBeNull();
  });

  it('menampilkan petunjuk saat jam kosong', async () => {
    const { getByText, getByLabelText } = await render(
      <TimeField value="" onChange={jest.fn()} accessibilityLabel="Jam Mulai" />
    );
    expect(getByText('Pilih jam')).toBeTruthy();
    expect(getByLabelText('Jam Mulai, belum dipilih')).toBeTruthy();
  });

  it('tidak membuka dialog saat form sedang disimpan', async () => {
    const { getByLabelText, queryByText } = await render(
      <TimeField value="10:00" onChange={jest.fn()} accessibilityLabel="Jam Mulai" disabled />
    );

    await fireEvent.press(getByLabelText('Jam Mulai, 10.00'));
    expect(queryByText('dialog jam')).toBeNull();
  });
});
