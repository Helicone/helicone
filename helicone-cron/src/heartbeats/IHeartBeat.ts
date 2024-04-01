import { Env } from "..";

export interface IHeartBeat {
  beat(env: Env): Promise<number>;
}
