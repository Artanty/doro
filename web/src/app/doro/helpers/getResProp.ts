export const thisProjectResProp = () => {
	return `${process.env['PROJECT_NAME']}@${process.env['NAMESPACE']}`
}