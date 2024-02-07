import {CounterService} from "../services/counter.service";

export type TEndpointWithDep = {
  url: string,
  dep?: {
    prop: string,
    fromReqUrl: string,
    fromReqProp: string
  },
  callback?: keyof CounterService
}

const endpointsWithDeps: TEndpointWithDep[] = [
  {
    url: 'getScheduleConfig',
    callback: 'onReceiveScheduleConfig'
  },
  {
    url: 'getSchedule',
    dep: {
      prop: 'id',
      fromReqUrl: 'getScheduleConfig',
      fromReqProp: 'schedule_id'
    },
    callback: 'onReceiveSchedule'
  },
  {
    url: 'getScheduleEvents',
    dep: {
      prop: 'id',
      fromReqUrl: 'getScheduleConfig',
      fromReqProp: 'schedule_id'
    },
    callback: 'onReceiveScheduleEvents'
  }
];

export function getEndpointsWithDeps (endpoints: string[]): TEndpointWithDep[] {
  return endpoints.map((endpoint: string) => {
    return endpointsWithDeps
      .find((el: TEndpointWithDep) => el.url === endpoint)
    ?? { url: endpoint }
  })
}
