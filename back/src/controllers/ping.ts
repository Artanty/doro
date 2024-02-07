// interface PingResponse {
//     message: string;
// }
//
// export default class PingController {
//     public async getMessage(): Promise {
//         return {
//             message: "hello",
//         };
//     }
// }
import { Get, Route } from "tsoa";

interface PingResponse {
    message: string;
}

@Route("ping")
export default class PingController {
    @Get("/")
    public async getMessage(): Promise<any> {
        return {
            message: "hello",
        };
    }
}