import { Image } from 'expo-image';

const assets = {
  back: require('../../../../assets/asisten/back.svg'),
  calendarSmall: require('../../../../assets/asisten/calendar-small.svg'),
  liveDot: require('../../../../assets/asisten/live-dot.svg'),
  lock: require('../../../../assets/asisten/lock.svg'),
  lockSmall: require('../../../../assets/asisten/lock-small.svg'),
  lockDanger: require('../../../../assets/asisten/lock-danger.svg'),
  doorClosed: require('../../../../assets/asisten/door-closed.svg'),
  doorOpenWhite: require('../../../../assets/asisten/door-open-white.svg'),
  doorOpen: require('../../../../assets/asisten/door-open.svg'),
  users: require('../../../../assets/asisten/users.svg'),
  chartWhite: require('../../../../assets/asisten/chart-white.svg'),
  calendarWhite: require('../../../../assets/asisten/calendar-white.svg'),
  plus: require('../../../../assets/asisten/plus.svg'),
  dotOpen: require('../../../../assets/asisten/dot-open.svg'),
  clock: require('../../../../assets/asisten/clock.svg'),
  pin: require('../../../../assets/asisten/pin.svg'),
  arrow: require('../../../../assets/asisten/arrow.svg'),
  dotNeutral: require('../../../../assets/asisten/dot-neutral.svg'),
  info: require('../../../../assets/asisten/info.svg'),
  calendar: require('../../../../assets/asisten/calendar.svg'),
  chart: require('../../../../assets/asisten/chart.svg'),
  calendarPlus: require('../../../../assets/asisten/calendar-plus.svg'),
};
export function ScheduleIcon({ name, size }: { name: keyof typeof assets; size: number }) {
  return <Image source={assets[name]} style={{ width: size, height: size }} contentFit="contain" accessible={false} />;
}
