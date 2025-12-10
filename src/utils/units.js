export const toDecimalInches = (input) => {
    if (!input) return 0;
    const str = String(input).trim().toLowerCase();

    // 1. Handle MM (e.g. "12mm")
    if (str.endsWith('mm')) {
        const val = parseFloat(str.replace('mm', ''));
        return val * 0.0393701;
    }

    // 2. Handle Fractions (e.g. "1/2")
    if (str.includes('/')) {
        const [num, den] = str.split('/').map(Number);
        if (den !== 0) return num / den;
    }

    // 3. Handle Decimal (e.g. "0.5")
    return parseFloat(str);
};

export const formatInches = (val) => {
    return val ? `${val.toFixed(3)}"` : '-';
};