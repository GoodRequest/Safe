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

## Additional Resources

<img align="left" width="25" height="25" alt="Bun" src="https://seeklogo.com/images/B/bun-logo-A876328A1F-seeklogo.com.png">[**Bun**](https://bun.sh) documentation is available [here](https://bun.sh/docs).

<img align="left" width="25" height="25" alt="Redis" src="https://redis.io/images/favicons/favicon-32x32.png">[**Redis**](https://redis.io) documentation is available [here](https://redis.io/docs).

<img align="left" width="25" height="25" alt="Docker" src="https://www.docker.com/wp-content/uploads/2023/04/cropped-Docker-favicon-32x32.png">[**Docker**](https://www.docker.com) documentation is available [here](https://docs.docker.com).

<img align="left" width="25" height="25" alt="NGINX" src="https://www.nginx.com/wp-content/uploads/2019/10/favicon-48x48.ico">[**NGINX**](https://www.nginx.com) documentation is available [here](https://nginx.org/en/docs/).

## License

**Safe** is released under the MIT license. See [LICENSE.md](./LICENSE.md) for details.
