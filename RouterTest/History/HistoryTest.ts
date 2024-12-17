import History from 'Router/_private/History';
import { IHistoryState } from 'Router/_private/DataInterfaces';

/**
 * History лоя unit тестов c необходимыми публичными методами
 */
export default class HistoryTest extends History {
    setHistory(newHistory: IHistoryState[]): void {
        this._setHistory(newHistory);
    }

    setHistoryPosition(position: number): void {
        this._setHistoryPosition(position);
    }

    /**
     * Выставить текущее состояние истории SPA переходов
     */
    setInititalSpaHistory(newHistorySPA: string[]): void {
        this._spaHistory = [...newHistorySPA];
    }

    getSpaHistory(): string[] {
        return this._spaHistory;
    }
}
