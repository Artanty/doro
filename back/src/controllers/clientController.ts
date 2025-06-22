import { getClients } from "../index";
import ScheduleConfigController from "./scheduleConfigController";

export default class ClientController {

  public static async stopScheduleEventIfNoClients() {
      const clients = getClients()
      if (clients && clients.length) {

      } else {
        ScheduleConfigController.stopActiveScheduleEvent()
      }
  }

}