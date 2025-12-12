export const buildOuterEntityId = (type: string = 'event', id: string | number): string => {
	const entitiesMap = {
		event: 'e'
	}

	const entityPrefix = entitiesMap[type]

	return `${entityPrefix}_${id}`;
}