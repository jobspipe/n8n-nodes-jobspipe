import type { INodeProperties } from 'n8n-workflow';
import { paginateByCursor } from './paginate';

export const listValue =
	'={{ $value ? String($value).split(",").map(s => s.trim()).filter(Boolean) : [] }}';

export const upperListValue =
	'={{ $value ? String($value).split(",").map(s => s.trim().toUpperCase()).filter(Boolean) : [] }}';

export const positiveOrUnset = '={{ $value > 0 ? $value : undefined }}';

type Show = { resource: string[]; operation: string[] };

export function pagingFields(show: Show, noun: string): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: { show },
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			routing: {
				send: { paginate: '={{ $value }}' },
				operations: { pagination: paginateByCursor },
			},
		},
		{
			displayName: `Each returned ${noun} costs 1 credit. Max Results caps the total.`,
			name: 'creditNotice',
			type: 'notice',
			displayOptions: { show: { ...show, returnAll: [true] } },
			default: '',
		},
		{
			displayName: 'Max Results',
			name: 'maxResults',
			type: 'number',
			typeOptions: { minValue: 1 },
			displayOptions: { show: { ...show, returnAll: [true] } },
			default: 100,
			description: `Stop after this many ${noun} results. It caps the credits a run can spend.`,
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: { minValue: 1, maxValue: 100 },
			displayOptions: { show: { ...show, returnAll: [false] } },
			default: 50,
			description: 'Max number of results to return',
			routing: { send: { type: 'body', property: 'limit' } },
		},
	];
}

export const includeMetadataOption: INodeProperties = {
	displayName: 'Include Response Metadata',
	name: 'includeMetadata',
	type: 'boolean',
	default: false,
	description:
		'Whether to add the response metadata (credits charged, total results) to each item as _metadata',
};
