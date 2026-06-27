import { getUTCDatetime } from "../utils/get-utc-datetime";

export interface EventUpdate {
    id: number;
    name?: string;
    length?: number;
    is_rest?: boolean;
    schedule_id?: number;
    schedule_position?: number;
    playhead?: number;
    updated_at?: string;
}

export async function updateEventsDb(
    connection: any,
    updates: EventUpdate[]
): Promise<any> {

    const res: any = {
        success: false,
        result: null,
        error: null
    }

    try {
        if (!updates || updates.length === 0) {
            throw new Error('Empty updates array');
        }

        // Получаем текущее время один раз для всех обновлений
        const currentDatetime = getUTCDatetime();
        
        let totalAffectedRows = 0;

        // Выполняем простой UPDATE для каждого элемента массива
        for (const update of updates) {
            // Собираем только те поля, которые были переданы для обновления
            const setClauses: string[] = [];
            const values: any[] = [];

            if ('name' in update && update.name !== undefined) {
                setClauses.push('name = ?');
                values.push(update.name);
            }
            if ('length' in update && update.length !== undefined) {
                setClauses.push('length = ?');
                values.push(update.length);
            }
            // ... и так далее для других полей
            if ('is_rest' in update && update.is_rest !== undefined) {
                setClauses.push('is_rest = ?');
                values.push(update.is_rest ? 1 : 0);
            }
            if ('schedule_id' in update && update.schedule_id !== undefined) {
                setClauses.push('schedule_id = ?');
                values.push(update.schedule_id);
            }
            if ('schedule_position' in update && update.schedule_position !== undefined) {
                setClauses.push('schedule_position = ?');
                values.push(update.schedule_position);
            }
            if ('playhead' in update && update.playhead !== undefined) {
                setClauses.push('playhead = ?');
                values.push(update.playhead);
            }

            // Поле updated_at добавляем всегда, если есть хоть одно другое поле для обновления
            if (setClauses.length > 0) {
                setClauses.push('updated_at = ?'); // Добавляем его последним в список SET
                values.push(currentDatetime);      // И соответствующее значение в конец массива
                values.push(update.id);            // Значение для WHERE идем самым последним

                const query = `
                    UPDATE events 
                    SET ${setClauses.join(', ')}
                    WHERE id = ?
                `;
                
                const [result] = await connection.execute(query, values);
                totalAffectedRows += result.affectedRows;
            }
        }

        res.result = { affectedRows: totalAffectedRows };

        if(totalAffectedRows > 0) {
            res.success = true;
        } else {
            res.error = 'no rows were affected';
        }

        return res;

    } catch(error: any) {
        res.error = error.message;
        return res;
    }
}