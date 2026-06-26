export interface CtlResult<
	TData = Record<string, any>, 
	TDebug = Record<string, any>,
	TError = any
> {
	data: TData;
	debug: TDebug;
	error?: TError;
}