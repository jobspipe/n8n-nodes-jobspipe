import {
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type JsonObject,
} from 'n8n-workflow';
import { mapJobsPipeError } from './errors';

export const ADDITIONAL_FILTERS_ERROR = 'Additional Filters must be a JSON object';

function isEmpty(value: unknown): boolean {
	return (
		value === undefined ||
		value === null ||
		value === '' ||
		(Array.isArray(value) && value.length === 0)
	);
}

function parseAdditionalFilters(value: unknown): IDataObject | undefined {
	if (isEmpty(value)) return {};
	let parsed: unknown = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value);
		} catch {
			return undefined;
		}
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
	return parsed as IDataObject;
}

/** Answers undefined when Additional Filters is not a JSON object. */
export function cleanRequestBody(body: IDataObject): IDataObject | undefined {
	const { additionalFilters, ...explicit } = body;
	const extra = parseAdditionalFilters(additionalFilters);
	if (!extra) return undefined;
	const merged: IDataObject = { ...extra, ...explicit };
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(merged)) {
		if (!isEmpty(value)) out[key] = value;
	}
	return out;
}

export async function cleanBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = cleanRequestBody((requestOptions.body ?? {}) as IDataObject);
	if (!body) throw new NodeOperationError(this.getNode(), ADDITIONAL_FILTERS_ERROR);
	requestOptions.body = body;
	return requestOptions;
}

export function extractItems(
	body: IDataObject,
	path: string | null,
	includeMetadata: boolean,
): INodeExecutionData[] {
	if (path === null) return [{ json: body }];
	const rows = body[path];
	if (!Array.isArray(rows)) return [];
	return rows.map((row) => {
		const json: IDataObject = { ...(row as IDataObject) };
		if (path === 'detected') {
			json.domain = body.domain;
			json.scanned_at = body.scanned_at;
		}
		if (includeMetadata && body.metadata !== undefined) json._metadata = body.metadata;
		return { json };
	});
}

export function throwIfError(
	this: IExecuteSingleFunctions,
	statusCode: number,
	body: unknown,
): void {
	if (statusCode < 400) return;
	const { message, description } = mapJobsPipeError(statusCode, body);
	const errorBody = (
		body && typeof body === 'object' ? body : { error: String(body) }
	) as JsonObject;
	throw new NodeApiError(this.getNode(), errorBody, {
		message,
		description,
		httpCode: String(statusCode),
	});
}

export function includeMetadataOption(this: IExecuteSingleFunctions): boolean {
	return Boolean(this.getNodeParameter('options.includeMetadata', false));
}

export function toItems(path: string | null) {
	return async function (
		this: IExecuteSingleFunctions,
		_items: INodeExecutionData[],
		response: IN8nHttpFullResponse,
	): Promise<INodeExecutionData[]> {
		throwIfError.call(this, response.statusCode, response.body);
		return extractItems(
			(response.body ?? {}) as IDataObject,
			path,
			includeMetadataOption.call(this),
		);
	};
}
