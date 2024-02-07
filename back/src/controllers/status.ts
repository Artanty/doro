import { Get, Route } from "tsoa";
import {getClients} from "../index";

@Route("status")
export default class StatusController {
    @Get("/")
    public async getMessage(): Promise<any> {
        return {
            entity: "clients",
            clients: getClients().length
        };
    }
}

