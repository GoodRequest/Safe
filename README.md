# <img align="left" width="40" height="40" alt="GoodRequest, s.r.o." src="./favicon.png">Safe

[![dockeri.co](https://dockerico.blankenship.io/image/goodrequestcom/safe)](https://hub.docker.com/r/goodrequestcom/safe)

**Safe** enables sharing **confidential information** with a limited **number of views** and **overall lifetime**.

## Features

🕸️ _Web Native_ frontend build with pure **HTML**, **CSS** and **JS**. <br>
🪶 _Simple_ and _lightweight_ single-file backend with **Bun**. <br>
🔏 _Fast_ and _secure_ data management with **Redis**.

## A (Very) Quick Start

Deploy the app in a Docker Compose stack with (non-persistent) **Redis** and (reverse proxy) **NGINX**.

Once deployed, open the app, input the data, stash it and share the generated **Safe** link as needed.

Optionally, limit access to an internal route with the help of NGINX allow and deny configuration.

## Security 101

Limit secret information view count and lifetime as much as possible.

Try not to share sets of secrets, or unnecessarily note their purpose.

Share the generated links only through secure channels. Stay Safe.

## Environment variables

To make **Safe** run smoothly, add these environment variables to the container configuration:
```bash
# Disables Bun telemetry
DO_NOT_TRACK=1

# Enables connections to the Redis server
REDIS_URL=

# Path segment used to differentiate
# between Company (e.g. VPN restricted) 
# and Client (public) Safe through e.g.
# NGINX location routing configuration
INTERNAL_PATH=

# Enables file sharing over AWS S3 (1/4)
AWS_DEFAULT_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
```

## Additional Resources

<img align="left" width="25" height="25" alt="Bun" src="https://bun.sh/favicon.ico">&nbsp;[**Bun**](https://bun.sh) documentation is available [here](https://bun.sh/docs).

<img align="left" width="25" height="25" alt="Redis" src="https://redis.io/favicon.ico">&nbsp;[**Redis**](https://redis.io) documentation is available [here](https://redis.io/docs).

<img align="left" width="25" height="25" alt="Docker" src="https://www.docker.com/favicon.ico">&nbsp;[**Docker**](https://www.docker.com) documentation is available [here](https://docs.docker.com).

<img align="left" width="25" height="25" alt="NGINX" src="https://nginx.org/favicon.ico">&nbsp;[**NGINX**](https://www.nginx.com) documentation is available [here](https://nginx.org/en/docs/).

## License

**Safe** is released under the MIT license. See [LICENSE.md](./LICENSE.md) for details.
