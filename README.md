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

# Cache settings
You can configure your [cache settings](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) via 'wrangler.toml' or use the default configuration.

# Cors
If you encounter cors issues, you can set `access_control_allow_origin` from 'wrangler.toml'

# Signed Headers
To prevent authentication failures, a set of headers has been filtered for AWS signatures, including `x-real-ip`, `x-forwarded-proto`, and `accept-encoding`, and any headers beginning with `cf-`. This is because Cloudflare will overwrite these values in downstream requests.
