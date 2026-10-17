const getSeatLabel = (seat) => String(seat.seatNumber || seat.seatName || seat.fullSeatName || '');

const getRowInfo = (seat) => {
  const explicitRow = seat.rowLabel ?? seat.rowName ?? seat.seatRow ?? seat.rowNumber ?? seat.row;
  const explicitColumn = seat.columnNumber ?? seat.seatColumn ?? seat.column ?? seat.seatIndex;
  if (explicitRow !== undefined && explicitRow !== null && String(explicitRow).trim()) {
    const label = getSeatLabel(seat);
    const labelColumn = label.match(/(\d+)$/)?.[1];
    const column = Number(explicitColumn ?? labelColumn);
    return { row: String(explicitRow).trim(), column: column || null };
  }

  const label = getSeatLabel(seat);
  const alphaNumeric = label.match(/^([a-z]+)[\s-]*0*(\d+)$/i);
  if (alphaNumeric) {
    return { row: alphaNumeric[1].toUpperCase(), column: Number(alphaNumeric[2]) };
  }

  const numericAlpha = label.match(/^0*(\d+)[\s-]*([a-z]+)$/i);
  if (numericAlpha) {
    return { row: numericAlpha[1], column: numericAlpha[2].toUpperCase().charCodeAt(0) - 64 };
  }

  return { row: 'Ghế', column: null };
};

const compareNatural = (left, right) => left.localeCompare(right, 'vi', { numeric: true, sensitivity: 'base' });

export const groupSeatsByRow = (seats = []) => {
  const rows = new Map();
  seats.forEach((seat, index) => {
    const { row, column } = getRowInfo(seat);
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row).push({ seat, index, column });
  });

  return [...rows.entries()]
    .sort(([left], [right]) => compareNatural(left, right))
    .map(([label, rowSeats]) => ({
      label,
      seats: rowSeats
        .sort((left, right) => {
          if (left.column !== null && right.column !== null) return left.column - right.column;
          if (left.column !== null) return -1;
          if (right.column !== null) return 1;
          return left.index - right.index;
        })
        .map(({ seat }) => seat),
    }));
};
