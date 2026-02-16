import { Transaction } from '../api/transactionService';

export interface TransactionSection {
    title: string;
    data: Transaction[];
    summary: {
        income: number;
        expense: number;
    };
}

export const groupTransactionsByDate = (transactions: Transaction[]): TransactionSection[] => {
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach((transaction) => {
        // Assuming transaction.date is in YYYY-MM-DD format or ISO format that starts with YYYY-MM-DD
        const date = transaction.date.split('T')[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
    });

    const sections: TransactionSection[] = Object.keys(groups).map((date) => {
        const dayTransactions = groups[date];
        let income = 0;
        let expense = 0;

        dayTransactions.forEach((t) => {
            // transaction_type: 1 = income, 2 = expense
            if (t.transaction_type === 1) {
                income += t.amount;
            } else {
                expense += t.amount;
            }
        });

        return {
            title: date,
            data: dayTransactions,
            summary: {
                income,
                expense,
            },
        };
    });

    // Sort sections by date descending (newest first)
    return sections.sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime());
};
