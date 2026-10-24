export function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${date}T00:00:00+07:00`));
}

export function formatAttendanceTime(instant: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(instant));
}
