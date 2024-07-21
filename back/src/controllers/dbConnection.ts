import { CORE_BADGE } from "../core/constants";
import { getDbConnection } from "../dbActions/getDbConnection";
import { log, logError } from "../utils/Logger";

export default class DbConnectionController {
  public static async getDbConnection(): Promise<void> {
    try {
      await getDbConnection()
      log('Database connected', { badge: CORE_BADGE })
    } catch (err: unknown) {
      await logError(err)

      throw err
    }
  }    
}

