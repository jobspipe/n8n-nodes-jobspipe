function field(body: unknown, key: string): string | undefined {
	if (body && typeof body === 'object') {
		const value = (body as Record<string, unknown>)[key];
		if (typeof value === 'string') return value;
	}
	return undefined;
}

export function mapJobsPipeError(
	status: number,
	body: unknown,
): { message: string; description?: string } {
	const apiMessage = field(body, 'message');
	const apiError = field(body, 'error') ?? (typeof body === 'string' ? body : undefined);
	if (status === 401) {
		return {
			message: 'JobsPipe rejected the API key. Check the credential.',
			description: apiMessage,
		};
	}
	if (status === 402) {
		return {
			message: 'Out of JobsPipe credits. Upgrade or buy credits at jobspipe.dev/pricing.',
			description: apiMessage,
		};
	}
	if (status === 429) {
		return {
			message: "JobsPipe rate limit reached. Wait and retry, or lower the workflow's speed.",
			description: apiMessage,
		};
	}
	if (status === 400) {
		return { message: apiMessage ?? apiError ?? 'JobsPipe rejected the request (400).' };
	}
	return {
		message: `JobsPipe request failed (${status}): ${apiMessage ?? apiError ?? 'no details'}`,
	};
}
