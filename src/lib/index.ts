// place files you want to import through the `$lib` alias in this folder.
export function strStartsWith<const S extends string>(
	str: string,
	starts: S
): str is `${S}${string}` {
	return str.startsWith(starts);
}
export function strAfter<const T extends string, const S extends string>(
	str: T,
	starts: S
): T extends `${S}${infer A}` ? A : "" {
	// @ts-expect-error its fine this is just TS being wrong
	if (!strStartsWith(str, starts)) return "";
	// @ts-expect-error its fine this is just TS being wrong
	return str.slice(starts.length);
}
