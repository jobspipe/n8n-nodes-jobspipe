import type { INodeProperties } from 'n8n-workflow';
import { cleanBody, toItems } from '../shared/items';
import {
	includeMetadataOption,
	listValue,
	pagingFields,
	positiveOrUnset,
	upperListValue,
} from '../shared/fields';

const showKey = { resource: ['company'], operation: ['get', 'getTechStack'] };
const showStack = { resource: ['company'], operation: ['getTechStack'] };
const showSearch = { resource: ['company'], operation: ['searchByTechnology'] };

const companyPath = '/v1/companies/{{ encodeURIComponent(String($parameter.companyKey).trim()) }}';

const tierOptions = [
	{ name: 'Confirmed', value: 'confirmed', description: 'Only the strongest evidence' },
	{ name: 'Likely', value: 'likely', description: 'Confirmed or likely evidence' },
	{ name: 'Mentioned', value: 'mentioned', description: 'Any mention in a job posting' },
];

export const companyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['company'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a company',
				description: 'Get a company profile by domain or name',
				routing: {
					request: { method: 'GET', url: `=${companyPath}` },
					output: { postReceive: [toItems(null)] },
				},
			},
			{
				name: 'Get Tech Stack',
				value: 'getTechStack',
				action: 'Get a company tech stack',
				description: 'Get the technologies a company uses, from its job postings',
				routing: {
					request: { method: 'GET', url: `=${companyPath}/technologies` },
					output: { postReceive: [toItems('data')] },
				},
			},
			{
				name: 'Search by Technology',
				value: 'searchByTechnology',
				action: 'Search companies by technology',
				description: 'Find companies whose job postings show they use a technology',
				routing: {
					request: { method: 'POST', url: '/v1/companies/search' },
					send: { preSend: [cleanBody] },
					output: { postReceive: [toItems('data')] },
				},
			},
		],
		default: 'get',
	},
	{
		displayName: 'Company',
		name: 'companyKey',
		type: 'string',
		required: true,
		displayOptions: { show: showKey },
		default: '',
		placeholder: 'e.g. stripe.com',
		description: 'Company domain (best) or name',
	},
	{
		displayName: 'Minimum Evidence',
		name: 'tierMin',
		type: 'options',
		displayOptions: { show: showStack },
		options: tierOptions,
		default: 'likely',
		description: 'Weakest evidence tier that counts',
		routing: { send: { type: 'query', property: 'tier_min' } },
	},
	{
		displayName: 'Kinds',
		name: 'kind',
		type: 'string',
		displayOptions: { show: showStack },
		default: '',
		placeholder: 'e.g. database,cloud',
		description: 'Comma-separated technology kinds to keep. Empty returns every kind.',
		routing: {
			send: {
				type: 'query',
				property: 'kind',
				value: '={{ $value ? String($value).replace(/\\s+/g, "").toLowerCase() : undefined }}',
			},
		},
	},
	{
		displayName: 'Technologies',
		name: 'technologies',
		type: 'string',
		required: true,
		displayOptions: { show: showSearch },
		default: '',
		placeholder: 'e.g. snowflake, dbt',
		description:
			'Comma-separated technology slugs. Matches companies using any of them (up to 10).',
		routing: { send: { type: 'body', property: 'company_technology_slug_or', value: listValue } },
	},
	{
		displayName: 'Countries',
		name: 'countries',
		type: 'string',
		displayOptions: { show: showSearch },
		default: '',
		placeholder: 'e.g. US, GB',
		description: 'Comma-separated ISO country codes of the job postings that name the technology',
		routing: { send: { type: 'body', property: 'company_country_code_or', value: upperListValue } },
	},
	{
		displayName: 'Min Employees',
		name: 'minEmployees',
		type: 'number',
		typeOptions: { minValue: 0 },
		displayOptions: { show: showSearch },
		default: 0,
		description: 'Only companies with at least this many employees. 0 means no minimum.',
		routing: { send: { type: 'body', property: 'min_employee_count', value: positiveOrUnset } },
	},
	{
		displayName: 'Max Employees',
		name: 'maxEmployees',
		type: 'number',
		typeOptions: { minValue: 0 },
		displayOptions: { show: showSearch },
		default: 0,
		description: 'Only companies with at most this many employees. 0 means no maximum.',
		routing: { send: { type: 'body', property: 'max_employee_count', value: positiveOrUnset } },
	},
	{
		displayName: 'Minimum Evidence',
		name: 'searchTierMin',
		type: 'options',
		displayOptions: { show: showSearch },
		options: tierOptions,
		default: 'likely',
		description: 'Weakest evidence tier that counts',
		routing: { send: { type: 'body', property: 'tier_min' } },
	},
	...pagingFields(showSearch, 'company'),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: { resource: ['company'] } },
		default: {},
		options: [includeMetadataOption],
	},
];
