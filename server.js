import { handler } from './build/handler.js';
import express from 'express';

const app = express();

// handle static folder ourselves which allows us to set custom headers
app.use(
	express.static('static', {
		setHeaders: (res, pathname, stats) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET');
			res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
			res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
		}
	})
);

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});
