import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class JobsPipeApi implements ICredentialType {
	name = 'jobsPipeApi';

	displayName = 'JobsPipe API';

	icon: Icon = {
		light: 'file:../nodes/JobsPipe/jobspipe.svg',
		dark: 'file:../nodes/JobsPipe/jobspipe.dark.svg',
	};

	documentationUrl =
		'https://github.com/jobspipe/n8n-nodes-jobspipe?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your JobsPipe API key. It starts with jp_live_. Create one at https://jobspipe.dev/dashboard.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.jobspipe.dev',
			url: '/v1/account',
		},
	};
}
