import type { IDataObject } from 'n8n-workflow';
import { collectPages, paginateByCursor } from '../nodes/JobsPipe/shared/paginate';

test('follows next_cursor and stops on null', async () => {
	const calls: Array<[string | undefined, number]> = [];
	const pages = [
		{ data: [{ id: 1 }, { id: 2 }], metadata: { next_cursor: 'c1' } },
		{ data: [{ id: 3 }], metadata: { next_cursor: null } },
	];
	const out = await collectPages(
		async (cursor, limit) => {
			calls.push([cursor, limit]);
			return pages[calls.length - 1];
		},
		100,
		25,
		false,
	);
	assert.deepEqual(
		out.map((i) => i.json.id),
		[1, 2, 3],
	);
	assert.deepEqual(calls, [
		[undefined, 25],
		['c1', 25],
	]);
});

test('never asks for more than maxResults', async () => {
	const calls: number[] = [];
	const out = await collectPages(
		async (_cursor, limit) => {
			calls.push(limit);
			return {
				data: Array.from({ length: limit }, (_, i) => ({ i })),
				metadata: { next_cursor: 'x' },
			};
		},
		60,
		25,
		false,
	);
	assert.equal(out.length, 60);
	assert.deepEqual(calls, [25, 25, 10]);
});

test('an empty page stops even with a cursor', async () => {
	let calls = 0;
	const out = await collectPages(
		async () => {
			calls++;
			return { data: [], metadata: { next_cursor: 'x' } };
		},
		100,
		25,
		false,
	);
	assert.equal(out.length, 0);
	assert.equal(calls, 1);
});

test('page 2 resends the full filter body plus the cursor', async () => {
	const bodies: IDataObject[] = [];
	const fake = {
		getNodeParameter: (name: string, fallback: unknown) => (name === 'maxResults' ? 3 : fallback),
		getNode: () => ({
			name: 'JobsPipe',
			type: 'jobsPipe',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		}),
		helpers: {
			httpRequestWithAuthentication: async (_cred: string, options: { body: IDataObject }) => {
				bodies.push(options.body);
				return bodies.length === 1
					? {
							statusCode: 200,
							body: { data: [{ id: 1 }, { id: 2 }], metadata: { next_cursor: 'c1' } },
						}
					: { statusCode: 200, body: { data: [{ id: 3 }], metadata: { next_cursor: null } } };
			},
		},
	};
	const requestData = {
		options: {
			method: 'POST',
			url: '/v1/jobs/search',
			body: { job_title_or: ['engineer'], limit: 25 },
		},
	};
	const items = await paginateByCursor.call(fake as never, requestData as never);
	assert.equal(items.length, 3);
	assert.deepEqual(bodies[0], { job_title_or: ['engineer'], limit: 3 });
	assert.deepEqual(bodies[1], { job_title_or: ['engineer'], limit: 1, cursor: 'c1' });
});

test('an error page throws the mapped error', async () => {
	const fake = {
		getNodeParameter: (_name: string, fallback: unknown) => fallback,
		getNode: () => ({
			name: 'JobsPipe',
			type: 'jobsPipe',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		}),
		helpers: {
			httpRequestWithAuthentication: async () => ({
				statusCode: 402,
				body: { error: 'Payment required' },
			}),
		},
	};
	await expect(
		paginateByCursor.call(fake as never, { options: { body: {} } } as never),
	).rejects.toThrow(/Out of JobsPipe credits/);
});
