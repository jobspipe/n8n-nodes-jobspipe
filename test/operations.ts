import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { JobsPipe } from '../nodes/JobsPipe/JobsPipe.node';

export type Operation = {
	resource: string;
	value: string;
	method: string;
	url: string;
	bodyKeys: string[];
	queryKeys: string[];
};

const properties = new JobsPipe().description.properties;

function shownFor(p: INodeProperties, resource: string, operation: string): boolean {
	const show = p.displayOptions?.show;
	if (!show) return false;
	const resources = show.resource as string[] | undefined;
	const operations = show.operation as string[] | undefined;
	return Boolean(resources?.includes(resource) && (!operations || operations.includes(operation)));
}

function sentKeys(props: INodeProperties[], type: 'body' | 'query'): string[] {
	const keys: string[] = [];
	for (const p of props) {
		const send = p.routing?.send;
		if (send?.type === type && send.property) keys.push(String(send.property));
		if (p.type === 'collection')
			keys.push(...sentKeys((p.options ?? []) as INodeProperties[], type));
	}
	return keys;
}

export function operations(): Operation[] {
	const out: Operation[] = [];
	for (const p of properties) {
		if (p.name !== 'operation') continue;
		const resource = (p.displayOptions?.show?.resource as string[])[0];
		for (const option of p.options as INodePropertyOptions[]) {
			const request = option.routing?.request ?? {};
			const fields = properties.filter((f) => shownFor(f, resource, String(option.value)));
			const body = Object.keys((request.body as object | undefined) ?? {});
			out.push({
				resource,
				value: String(option.value),
				method: String(request.method),
				url: String(request.url),
				bodyKeys: [...body, ...sentKeys(fields, 'body')],
				queryKeys: sentKeys(fields, 'query'),
			});
		}
	}
	return out;
}

export { properties };
