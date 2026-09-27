import { JobsPipe } from '../nodes/JobsPipe/JobsPipe.node';
import { operations } from './operations';

const byKey = Object.fromEntries(operations().map((o) => [`${o.resource}.${o.value}`, o]));

test('every operation routes to the documented endpoint', () => {
	const routes = Object.fromEntries(
		Object.entries(byKey).map(([k, o]) => [k, `${o.method} ${o.url}`]),
	);
	assert.deepEqual(routes, {
		'company.get':
			'GET =/v1/companies/{{ encodeURIComponent(String($parameter.companyKey).trim()) }}',
		'company.getTechStack':
			'GET =/v1/companies/{{ encodeURIComponent(String($parameter.companyKey).trim()) }}/technologies',
		'company.searchByTechnology': 'POST /v1/companies/search',
		'job.get': 'POST /v1/jobs/search',
		'job.search': 'POST /v1/jobs/search',
		'website.scanTechStack': 'POST /v1/stack/scan',
	});
});

test('job search sends the documented body fields', () => {
	assert.sameMembers(byKey['job.search'].bodyKeys, [
		'job_title_or',
		'job_country_code_or',
		'city_or',
		'remote',
		'job_seniority_or',
		'posted_at_max_age_days',
		'discovered_at_gte',
		'min_salary_usd',
		'additionalFilters',
		'limit',
		'include_technologies',
	]);
});

test('job get asks for any status and one row per id', () => {
	assert.sameMembers(byKey['job.get'].bodyKeys, ['status', 'limit', 'job_ids']);
});

test('company search sends the documented body fields', () => {
	assert.sameMembers(byKey['company.searchByTechnology'].bodyKeys, [
		'company_technology_slug_or',
		'company_country_code_or',
		'min_employee_count',
		'max_employee_count',
		'tier_min',
		'limit',
	]);
});

test('the node is an AI tool and uses the JobsPipe credential', () => {
	const d = new JobsPipe().description;
	assert.equal(d.usableAsTool, true);
	assert.deepEqual(d.credentials, [{ name: 'jobsPipeApi', required: true }]);
	assert.equal(d.requestDefaults?.baseURL, 'https://api.jobspipe.dev');
});
