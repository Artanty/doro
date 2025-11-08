import { Database } from "../core/dbConnect";

export async function getDbConnection () {
  
  return await Database.getInstance().authenticate();
}