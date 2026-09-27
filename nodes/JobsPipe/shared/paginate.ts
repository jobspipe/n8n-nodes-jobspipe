import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecuteSingleFunctions,
	IExecutePaginationFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';
import { extractItems, includeMetadataOption, throwIfError } from './items';

const PAGE_SIZE = 100;
const DEFAULT_MAX_RESULTS = 100;

export async function collectPages(
	fetchPage: (cursor: string | undefined, limit: number) => Promise<IDataObject>,
	maxResults: number,
	pageSize: number,
	includeMetadata: boolean,
): Promise<INodeExecutionData[]> {
	const items: INodeExecutionData[] = [];
	let cursor: string | undefined;
	while (items.length < maxResults) {
		const limit = Math.min(pageSize, maxResults - items.length);
		const body = await fetchPage(cursor, limit);
		const page = extractItems(body, 'data', includeMetadata);
		items.push(...page);
		const next = (body.metadata as IDataObject | undefined)?.next_cursor;
		if (page.length === 0 || typeof next !== 'string' || next === '') break;
		cursor = next;
	}
	return items.slice(0, maxResults);
}

export async function paginateByCursor(
	this: IExecutePaginationFunctions,
	requestData: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const maxResults =
		Number(this.getNodeParameter('maxResults', DEFAULT_MAX_RESULTS)) || DEFAULT_MAX_RESULTS;
	const includeMetadata = includeMetadataOption.call(this as IExecuteSingleFunctions);
	const baseBody = { ...((requestData.options.body ?? {}) as IDataObject) };
	delete baseBody.cursor;
	const fetchPage = async (cursor: string | undefined, limit: number): Promise<IDataObject> => {
		const options: IHttpRequestOptions = {
			...(requestData.options as IHttpRequestOptions),
			body: { ...baseBody, limit, ...(cursor ? { cursor } : {}) },
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		};
		const response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'jobsPipeApi',
			options,
		)) as IN8nHttpFullResponse;
		throwIfError.call(this as IExecuteSingleFunctions, response.statusCode, response.body);
		return (response.body ?? {}) as IDataObject;
	};
	return await collectPages(fetchPage, maxResults, PAGE_SIZE, includeMetadata);
}
