import { mapJobsPipeError } from '../nodes/JobsPipe/shared/errors';

test('401 names the credential', () => {
	assert.equal(
		mapJobsPipeError(401, { error: 'Invalid API key', message: 'x' }).message,
		'JobsPipe rejected the API key. Check the credential.',
	);
});

test('402 points to pricing', () => {
	assert.equal(
		mapJobsPipeError(402, { error: 'e' }).message,
		'Out of JobsPipe credits. Upgrade or buy credits at jobspipe.dev/pricing.',
	);
});

test('429 says wait', () => {
	assert.match(mapJobsPipeError(429, {}).message, /rate limit/);
});

test('400 passes the API message through', () => {
	const r = mapJobsPipeError(400, { error: 'Bad Request', message: 'Unknown filter: foo' });
	assert.equal(r.message, 'Unknown filter: foo');
});

test('other statuses keep the body error and status', () => {
	assert.equal(
		mapJobsPipeError(502, { error: 'scan failed' }).message,
		'JobsPipe request failed (502): scan failed',
	);
});

test('non-object body does not crash', () => {
	assert.equal(mapJobsPipeError(500, 'oops').message, 'JobsPipe request failed (500): oops');
});
