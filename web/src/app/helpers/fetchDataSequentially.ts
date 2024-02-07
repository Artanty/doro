import {
  concatMap,
  from,
  map,
  Observable,
  tap
} from "rxjs";
import {ajax} from "rxjs/internal/ajax/ajax";
import {
  getEndpointsWithDeps
} from "./sequentRequestsDependences";
import {SERVER_URL} from "../../../env";

export type TEndpointsWithDepsResponse = {
  response: any,
  callback?: string
}
export function fetchDataSequentially(endpoints: string[]): Observable<TEndpointsWithDepsResponse | any> {
  const endpointsWithDeps = getEndpointsWithDeps(endpoints)

  const responses: {url: string, res: any}[] = []

  function getDependencyResponse(fromReq: string) {
    return responses.find((el: any) => el.url === fromReq)?.res
  }

  return from(endpointsWithDeps).pipe(
    concatMap(endpoint => {
      let payload = null
      if (endpoint.dep) {
        const { prop, fromReqUrl, fromReqProp } = endpoint.dep;

        const depResponse = getDependencyResponse(fromReqUrl)

        if (depResponse) {
          payload = {[prop]: depResponse[fromReqProp]}
        }
      }

      return ajax.post(`${SERVER_URL}/${endpoint.url}`, payload).pipe(
        tap((res: any) => {

          responses.push({ url: endpoint.url, res : res.response })
        }),
        map((res: any) => ({ response: res.response, callback: endpoint.callback}))
      );
    })
  )
}
