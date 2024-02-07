export function getEntryFromSseResponse (res: any, key: string) {
  // res = JSON.parse(res)
  if (key in res) {
    return res[key]
  } else {
    throw(`no key ${key} in ${res}`)
  }
}

