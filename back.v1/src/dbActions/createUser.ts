import { User } from "../models/User";

export async function createUser (
    username: string, 
    password: string,
    active_config_id?: number, 
    ): Promise<User> {
    return await User.build({
        username,
        password,
        active_config_id
    }).save()
}
