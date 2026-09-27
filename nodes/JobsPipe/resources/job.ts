import type { INodeProperties } from 'n8n-workflow';
import { cleanBody, toItems } from '../shared/items';
import {
	includeMetadataOption,
	listValue,
	pagingFields,
	positiveOrUnset,
	upperListValue,
} from '../shared/fields';

const showSearch = { resource: ['job'], operation: ['search'] };
const showGet = { resource: ['job'], operation: ['get'] };

export const jobDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['job'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get jobs by ID',
				description: 'Get one or more job postings by their IDs',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/jobs/search',
						body: {
							status: 'any',
							limit:
								'={{ Math.max(1, String($parameter.jobIds).split(/[\\s,]+/).filter(Boolean).length) }}',
						},
					},
					send: { preSend: [cleanBody] },
					output: { postReceive: [toItems('data')] },
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search jobs',
				description: 'Search live job postings with filters',
				routing: {
					request: { method: 'POST', url: '/v1/jobs/search' },
					send: { preSend: [cleanBody] },
					output: { postReceive: [toItems('data')] },
				},
			},
		],
		default: 'search',
	},
	{
		displayName: 'Job IDs',
		name: 'jobIds',
		type: 'string',
		required: true,
		displayOptions: { show: showGet },
		default: '',
		placeholder: 'e.g. 4012345678, 4012345679',
		description: 'Comma-separated job IDs, as returned in the ID field of a search',
		routing: {
			send: {
				type: 'body',
				property: 'job_ids',
				value: '={{ String($value).split(/[\\s,]+/).filter(Boolean) }}',
			},
		},
	},
	{
		displayName: 'Job Titles',
		name: 'jobTitles',
		type: 'string',
		displayOptions: { show: showSearch },
		default: '',
		placeholder: 'e.g. data engineer, analytics engineer',
		description: 'Comma-separated. Matches jobs whose title contains any of them.',
		routing: { send: { type: 'body', property: 'job_title_or', value: listValue } },
	},
	{
		displayName: 'Countries',
		name: 'countries',
		type: 'string',
		displayOptions: { show: showSearch },
		default: '',
		placeholder: 'e.g. US, GB',
		description: 'Comma-separated ISO country codes',
		routing: { send: { type: 'body', property: 'job_country_code_or', value: upperListValue } },
	},
	{
		displayName: 'Cities',
		name: 'cities',
		type: 'string',
		displayOptions: { show: showSearch },
		default: '',
		placeholder: 'e.g. London, Berlin',
		description: 'Comma-separated whole city names',
		routing: { send: { type: 'body', property: 'city_or', value: listValue } },
	},
	{
		displayName: 'Remote',
		name: 'remote',
		type: 'options',
		displayOptions: { show: showSearch },
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Exclude Remote', value: 'onsite' },
			{ name: 'Remote Only', value: 'remote' },
		],
		default: 'any',
		routing: {
			send: {
				type: 'body',
				property: 'remote',
				value: '={{ $value === "any" ? undefined : $value === "remote" }}',
			},
		},
	},
	{
		displayName: 'Seniority',
		name: 'seniority',
		type: 'multiOptions',
		displayOptions: { show: showSearch },
		options: [
			{
				name: 'Director',
				value: 'director',
				description: 'Includes lead, staff, principal and manager roles',
			},
			{ name: 'Entry Level', value: 'entry_level' },
			{ name: 'Executive', value: 'executive', description: 'VP and C-level' },
			{ name: 'Mid Level', value: 'mid_level' },
			{ name: 'Senior', value: 'senior' },
		],
		default: [],
		description:
			'Match any of these levels. Jobs that state no level are left out when this is set.',
		routing: { send: { type: 'body', property: 'job_seniority_or' } },
	},
	{
		displayName: 'Posted Within Days',
		name: 'postedWithinDays',
		type: 'number',
		typeOptions: { minValue: 0 },
		displayOptions: { show: showSearch },
		default: 0,
		description: 'Only postings newer than this many days. 0 means no limit.',
		routing: { send: { type: 'body', property: 'posted_at_max_age_days', value: positiveOrUnset } },
	},
	{
		displayName: 'Discovered Since',
		name: 'discoveredSince',
		type: 'dateTime',
		displayOptions: { show: showSearch },
		default: '',
		description:
			'Only postings JobsPipe first saw at or after this time. Use it to poll for new jobs.',
		routing: {
			send: {
				type: 'body',
				property: 'discovered_at_gte',
				value:
					'={{ $value ? DateTime.fromISO($value).toUTC().toFormat("yyyy-LL-dd HH:mm:ss") : "" }}',
			},
		},
	},
	{
		displayName: 'Minimum Salary (USD)',
		name: 'minSalaryUsd',
		type: 'number',
		typeOptions: { minValue: 0 },
		displayOptions: { show: showSearch },
		default: 0,
		description:
			'Only jobs whose posted salary reaches this annual USD amount. Jobs without a posted salary never match. 0 means no minimum.',
		routing: { send: { type: 'body', property: 'min_salary_usd', value: positiveOrUnset } },
	},
	{
		displayName: 'Additional Filters (JSON)',
		name: 'additionalFilters',
		type: 'json',
		displayOptions: { show: showSearch },
		default: '',
		placeholder: '{"company_name_or": ["Stripe"], "job_description_contains_or": ["dbt"]}',
		description:
			'Any other documented search filter as a JSON object. Fields set above win. See https://docs.jobspipe.dev/api-reference/filters.',
		routing: { send: { type: 'body', property: 'additionalFilters' } },
	},
	...pagingFields(showSearch, 'job'),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: showSearch },
		default: {},
		options: [
			{
				displayName: 'Include Technologies',
				name: 'includeTechnologies',
				type: 'boolean',
				default: false,
				description:
					'Whether to add the technologies each posting names. Costs 1 extra credit per returned job that names a technology.',
				routing: { send: { type: 'body', property: 'include_technologies' } },
			},
			includeMetadataOption,
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: showGet },
		default: {},
		options: [includeMetadataOption],
	},
];
