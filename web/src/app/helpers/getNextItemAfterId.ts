export function getNextItemAfterId (array: any[], id: string | number) {
  const itemIndex = array?.map((el: any)=>el.id).indexOf(id)
  if ((itemIndex) < (array?.length - 1)) {
    return array[itemIndex + 1]
  }
  return null
}
