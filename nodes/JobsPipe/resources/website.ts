import type { INodeProperties } from 'n8n-workflow';
import { cleanBody, toItems } from '../shared/items';

const show = { resource: ['website'], operation: ['scanTechStack'] };

export const websiteDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['website'] } },
		options: [
			{
				name: 'Scan Tech Stack',
				value: 'scanTechStack',
				action: 'Scan a website tech stack',
				description: 'Detect the technologies a website serves. Costs 1 credit per call.',
				routing: {
					request: { method: 'POST', url: '/v1/stack/scan' },
					send: { preSend: [cleanBody] },
					output: { postReceive: [toItems('detected')] },
				},
			},
		],
		default: 'scanTechStack',
	},
	{
		displayName: 'Domain',
		name: 'domain',
		type: 'string',
		required: true,
		displayOptions: { show },
		default: '',
		placeholder: 'e.g. stripe.com',
		description: 'Domain to scan. URLs and www. are normalized.',
		routing: { send: { type: 'body', property: 'domain', value: '={{ String($value).trim() }}' } },
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		displayOptions: { show },
		options: [
			{
				name: 'Auto',
				value: 'auto',
				description: 'Fast fetch, then a browser render if results are thin',
			},
			{ name: 'HTML Only', value: 'html', description: 'Fast fetch only' },
			{ name: 'Render', value: 'render', description: 'Always render in a headless browser' },
		],
		default: 'auto',
		routing: { send: { type: 'body', property: 'mode' } },
	},
];
