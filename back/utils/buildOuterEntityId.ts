export type EntryType = 'event' | 'configHash' | 'transition'

export const buildOuterEntityId = (type: EntryType = 'event', id: string | number): string => {
	const entitiesMap = {
		event: 'e',
		configHash: 'h',
		transition: 't'
	}

	const entityPrefix = entitiesMap[type]

	return `${entityPrefix}_${id}`;
}