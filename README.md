# Propose
This article is a guide on how to leverage [Cloudflare](https://developers.cloudflare.com/workers/)'s Content Delivery Network (CDN) services alongside [C2 Object Storage](https://c2.synology.com/zh-tw/object-storage/overview). By integrating these two solutions,  you can enable direct access from Cloudflare CDN to C2 Object Storage.

# Configuration
1. Move the '/sample_config/wrangler.toml' file to the project root directory.
2. Fill in the required configuration details in the 'wrangler.toml' file.
3. Upload the secret key to Cloudflare Workers.

	```
	$ echo "{SECRET_KEY}" | wrangler secret put SECRET_KEY
	```


# Scripts
You need to setup the node envirnments and use `npm i` to install the required packages.
- For local development
	```
	$ npm run dev
	```
- Deploy to Cloudflare
	```
	$ npm run deploy
	```

# Example usage
If everything is cool, you can use folloing command to download your file from cdn.
- Download a file from c2 object storages:
	```
	$ curl {cdn_url}/{bucket_name}/{object}
	```
