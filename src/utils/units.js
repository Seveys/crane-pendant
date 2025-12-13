export const toDecimalInches = (input) => {
    if (!input) return 0;
    const str = String(input).trim().toLowerCase();

    let val = 0;

    // 1. Handle MM (e.g. "12mm")
    if (str.endsWith('mm')) {
        const v = parseFloat(str.replace('mm', ''));
        val = v * 0.0393701;
    }
    // 2. Handle Fractions (e.g. "1/2")
    else if (str.includes('/')) {
        const [num, den] = str.split('/').map(Number);
        if (den !== 0) val = num / den;
    }
    // 3. Handle Decimal (e.g. "0.5")
    else {
        val = parseFloat(str);
    }

    if (isNaN(val)) return 0;

    // ROUND TO NEAREST 0.001
    return Math.round(val * 1000) / 1000;
};

export const formatInches = (val) => {
    return val !== null && val !== undefined ? `${Number(val).toFixed(3)}"` : '-';
};