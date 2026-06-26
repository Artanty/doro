export interface Res<
	TData = Record<string, any>, 
	TDebug = Record<string, any>,
	TError = any
> {
	data: TData
    configHash: number
	debug: TDebug
	error?: TError
}