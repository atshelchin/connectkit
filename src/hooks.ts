import { deLocalizeUrl } from './utils/url-locale.js';

export const reroute = (request: { url: URL }) => {
	return deLocalizeUrl(request.url).pathname;
};
