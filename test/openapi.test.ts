import { operations } from './operations';

type Spec = {
	paths: Record<
		string,
		Record<string, { requestBody?: unknown; parameters?: Array<{ name: string; in: string }> }>
	>;
	components: { schemas: Record<string, unknown> };
};

const NODE_ONLY_KEYS = new Set(['additionalFilters']);

function specPath(url: string): string {
	return url.replace(/^=/, '').replace(/\{\{[^}]*\}\}/g, '{key}');
}

function bodyProperties(spec: Spec, requestBody: unknown): Set<string> {
	let schema = (requestBody as { content?: Record<string, { schema?: Record<string, unknown> }> })
		?.content?.['application/json']?.schema;
	const ref = schema?.$ref as string | undefined;
	if (ref)
		schema = spec.components.schemas[ref.split('/').pop() as string] as Record<string, unknown>;
	return new Set(Object.keys((schema?.properties as object | undefined) ?? {}));
}

describe('live OpenAPI contract', () => {
	let spec: Spec;
	beforeAll(async () => {
		const res = await fetch('https://api.jobspipe.dev/openapi.json');
		spec = (await res.json()) as Spec;
	}, 60_000);

	for (const op of operations()) {
		test(`${op.resource}.${op.value} matches the spec`, () => {
			const path = specPath(op.url);
			const operation = spec.paths[path]?.[op.method.toLowerCase()];
			assert.ok(operation, `${op.method} ${path} is not in the spec`);
			const props = bodyProperties(spec, operation.requestBody);
			for (const key of op.bodyKeys.filter((k) => !NODE_ONLY_KEYS.has(k))) {
				assert.ok(props.has(key), `${key} is not a body property of ${op.method} ${path}`);
			}
			const query = new Set(
				(operation.parameters ?? []).filter((p) => p.in === 'query').map((p) => p.name),
			);
			for (const key of op.queryKeys)
				assert.ok(query.has(key), `${key} is not a query parameter of ${path}`);
		});
	}
});
