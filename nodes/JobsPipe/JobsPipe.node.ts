import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { companyDescription } from './resources/company';
import { jobDescription } from './resources/job';
import { websiteDescription } from './resources/website';

export class JobsPipe implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JobsPipe',
		name: 'jobsPipe',
		icon: { light: 'file:jobspipe.svg', dark: 'file:jobspipe.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Search live job postings, look up companies and detect tech stacks with JobsPipe',
		defaults: {
			name: 'JobsPipe',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'jobsPipeApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.jobspipe.dev',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			ignoreHttpStatusErrors: true,
			returnFullResponse: true,
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Company', value: 'company' },
					{ name: 'Job', value: 'job' },
					{ name: 'Website', value: 'website' },
				],
				default: 'job',
			},
			...companyDescription,
			...jobDescription,
			...websiteDescription,
		],
	};
}
