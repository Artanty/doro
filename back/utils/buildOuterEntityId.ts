export const buildOuterEntityId = (type: string = 'event', id: string | number): string => {
	const entitiesMap = {
		event: 'e',
		configHash: 'h'
	}

	const entityPrefix = entitiesMap[type]

	return `${entityPrefix}_${id}`;
}