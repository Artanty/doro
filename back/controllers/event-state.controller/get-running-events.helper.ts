import { GetRunningEventsResItem } from "../../db-actions/get-running-events.db"
import { getUTCDatetime } from "../../utils/get-utc-datetime";

export const calculateDates = (date1: string, date2: string, operation: string, units: string): number => {
    let result = 0;

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    switch(operation) {
        case '-':
            result = d1.getTime() - d2.getTime();
            break;
        case '+':
            result = d1.getTime() + d2.getTime();
            break;
        default:
            throw new Error(`calculateDates err: operation "${operation}" not implemented`);
    }
    
    switch(units) {
        case 'seconds':
            result = Math.floor(result / 1000);
            break;
        default:
            throw new Error(`calculateDates err: units "${units}" not implemented`);
    }

    return result;
}

export const curryCalculateDates = (operation: string, units: string,) => {
    return (date1: string, date2: string) => {
        return calculateDates(date1, date2, operation, units)
    }
}

export const getDatesDiffInSeconds = curryCalculateDates('-', 'seconds');

/**
 * Если явного завершения запущенного события не произошло
 * или упали сервера, 
 * то состояние плейхэда нужно вычислить исходя из 
 * времени последнего "запуска" события.
 */
export const calculatePlayhead = (event: GetRunningEventsResItem): number => {
    const currentTime = getUTCDatetime();
    /**
     * Сколько прошло времени с последнего действия
     */
    const fromLastActionToNowSec = getDatesDiffInSeconds(currentTime, event.updated_at);
    /**
     *  Актуальный плейхэд
     */
    const lastActionPlayheadSec = event.schedule_event_playhead;
    const totalPlayed = lastActionPlayheadSec + fromLastActionToNowSec;
    /**
     * Если актуальный плейхэд больше или равен длительности события,
     * то оно закончено, т е плейхэд равен длительности.
     */
    const actualPlayhead = (event.length > totalPlayed) 
        ? totalPlayed
        : event.length;

    return actualPlayhead;
    
}
