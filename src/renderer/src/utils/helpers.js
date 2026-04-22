export function formatNumber(value) {
    if (value === null || value === undefined) return ''
    const parts = Number(value).toFixed(2).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return parts.join(',')
}

export function formatCount(value, decimals = 2) {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getDate(isoString) {
  if (!isoString) return { day: '', month: '', year: '', date: null };

  const date = new Date(isoString);

  const day = date.getUTCDate().toString().padStart(2, '0'); 
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); 
  const year = date.getUTCFullYear().toString();

  return {
    day,
    month,
    year,
    date
  }
}

export function formatDateWithClock(isoString) {
  const { day, month, year, date } = getDate(isoString);
  const hours = date.getUTCHours().toString().padStart(2, '0'); 
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return date ? `${day}.${month}.${year} - ${hours}:${minutes}` : '-';
}

export function formatDate(isoString) {
  const { day, month, year } = getDate(isoString);
  return isoString ? `${day}.${month}.${year}` : '-';
}

export function normalizeNumber(value) {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return value;
}

export const getUnitAmount = (str) => {
  const match = str?.match(/Ortalama KG Fiyatı:\s*([\d.]+)₺/);

  if (match) {
    const price = parseFloat(match[1]);
    return price;
  }
  return null;
}