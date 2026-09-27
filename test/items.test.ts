import { cleanRequestBody, extractItems } from '../nodes/JobsPipe/shared/items';

test('splits data into one item per row', () => {
	const items = extractItems(
		{ data: [{ id: 'a' }, { id: 'b' }], metadata: { credits_charged: 2 } },
		'data',
		false,
	);
	assert.deepEqual(
		items.map((i) => i.json),
		[{ id: 'a' }, { id: 'b' }],
	);
});

test('null path returns the whole body as one item', () => {
	const items = extractItems({ name: 'Stripe', domain: 'stripe.com' }, null, false);
	assert.deepEqual(items, [{ json: { name: 'Stripe', domain: 'stripe.com' } }]);
});

test('metadata is attached only when asked', () => {
	const body = { data: [{ id: 'a' }], metadata: { credits_charged: 1, total_results: null } };
	assert.equal(extractItems(body, 'data', false)[0].json._metadata, undefined);
	assert.deepEqual(extractItems(body, 'data', true)[0].json._metadata, {
		credits_charged: 1,
		total_results: null,
	});
});

test('detected technologies carry the scanned domain', () => {
	const items = extractItems(
		{
			domain: 'stripe.com',
			scanned_at: '2026-09-27T10:00:00Z',
			http_status: 200,
			detected: [{ slug: 'react' }],
		},
		'detected',
		false,
	);
	assert.deepEqual(items[0].json, {
		slug: 'react',
		domain: 'stripe.com',
		scanned_at: '2026-09-27T10:00:00Z',
	});
});

test('a missing array yields no items', () => {
	assert.deepEqual(extractItems({ metadata: {} }, 'data', false), []);
});

test('drops empty values', () => {
	assert.deepEqual(
		cleanRequestBody({
			job_title_or: [],
			city_or: ['Berlin'],
			discovered_at_gte: '',
			remote: null,
			limit: 25,
		}),
		{ city_or: ['Berlin'], limit: 25 },
	);
});

test('keeps false and zero-free booleans', () => {
	assert.deepEqual(cleanRequestBody({ remote: false }), { remote: false });
});

test('merges additional filters, explicit fields win', () => {
	assert.deepEqual(
		cleanRequestBody({
			remote: true,
			additionalFilters: '{"remote":false,"company_name_or":["Stripe"]}',
		}),
		{ remote: true, company_name_or: ['Stripe'] },
	);
});

test('additional filters may already be an object', () => {
	assert.deepEqual(cleanRequestBody({ additionalFilters: { min_salary_usd: 100000 } }), {
		min_salary_usd: 100000,
	});
});

test('additional filters must be a JSON object', () => {
	assert.equal(cleanRequestBody({ additionalFilters: '[1]' }), undefined);
	assert.equal(cleanRequestBody({ additionalFilters: '{bad' }), undefined);
});
