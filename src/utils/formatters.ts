/**
 * Currency Formatter
 * Formats numbers to specified currency format (defaults to IDR)
 */
export const formatCurrency = (amount: number, currencyCode: string = 'IDR'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Compact Currency Formatter
 * Formats large numbers in compact form (e.g., 1.5M, 2.3K)
 */
export const formatCurrencyCompact = (amount: number): string => {
    if (amount >= 1000000000) {
        return `Rp ${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `Rp ${(amount / 1000).toFixed(1)}K`;
    }
    return `Rp ${amount}`;
};

/**
 * Date Formatter - Short Format
 * Returns date in format: "1 Jan 2025"
 */
export const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

/**
 * Date Formatter - Long Format
 * Returns date in format: "1 January 2025"
 */
export const formatDateLong = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

/**
 * Relative Date Formatter
 * Returns relative date like "Today", "Yesterday", or formatted date
 */
export const formatDateRelative = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare only dates
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
        return 'Today';
    }
    if (date.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    // Check if it's within this week
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date > weekAgo) {
        return date.toLocaleDateString('id-ID', { weekday: 'long' });
    }

    return formatDateShort(dateString);
};

/**
 * Month-Year Formatter
 * Returns date in format: "January 2025"
 */
export const formatMonthYear = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
    });
};

/**
 * Get Current Month Date Range
 * Returns start and end date of current month in YYYY-MM-DD format
 */
export const getCurrentMonthRange = (): { start_date: string; end_date: string } => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        start_date: formatDate(start),
        end_date: formatDate(end),
    };
};

/**
 * Number Formatter
 * Formats numbers with thousand separators
 */
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Percentage Formatter
 * Formats number as percentage
 */
export const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
};

/**
 * Get Currency Symbol
 * Returns the currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode: string = 'IDR'): string => {
    return (0).toLocaleString('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).replace(/[0-9]/g, '');
};
