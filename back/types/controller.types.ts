export interface ControllerResult<
	TData = Record<string, any>, 
	TDebug = Record<string, any>
> {
	data: TData;
	debug: TDebug;
}