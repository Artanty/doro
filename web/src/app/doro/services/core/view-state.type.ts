export enum ViewStatus {
  LOADING = 0,
  READY = 1,
  ERROR = 2,
}

export interface ViewState<T = null> {
  status: ViewStatus,
  data?: T,
  error?: any
}