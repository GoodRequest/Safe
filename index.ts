import { type Serve } from 'bun'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
    retryStrategy: (times: number) => Math.min(times * 100, 30_000)
})

const responseWithLoadedAndRegexedHtmlFile = async (fileName: string, replacements?: Array<Array<string>>) => {
    let fileContent = await Bun.file(import.meta.dir + '/' + fileName).text()

    if (replacements && replacements.length) {
        replacements.forEach(([pattern, value]) => {
            fileContent = fileContent.replace(pattern, value)
        })
    }

    return new Response(fileContent, { headers: { 'Content-Type': 'text/html' } })
}

export default {
    port: process.env.PORT || 8000,
    fetch: async ({ url, method, body }) => {
        try {
            const { pathname } = new URL(url)

            if (pathname === '/favicon.png') {
                return new Response(Bun.file('./favicon.png'))
            }

            if (pathname === '/') {
                if (method === 'GET') {
                    return responseWithLoadedAndRegexedHtmlFile('gui_landing.html')
                }

                if (method === 'POST' && body) {
                    const { internal, secret, requestLimit, timeLimitInMinutes } = await Bun.readableStreamToJSON(body)

                    const internalPath = process.env.INTERNAL_PATH || 'internal'
                    const secretID = `${internal ? internalPath + '/' : ''}${crypto.randomUUID()}`

                    await redis.set(`${secretID}-value`, secret, 'EX', timeLimitInMinutes * 60)
                    await redis.set(`${secretID}-requests`, requestLimit, 'EX', timeLimitInMinutes * 60)

                    return new Response(secretID)
                }
            }

            const secretID = pathname.substring(1)
            if (secretID) {
                const secretValue = await redis.get(`${secretID}-value`)

                if (secretValue) {
                    const requestLimit = await redis.get(`${secretID}-requests`)

                    if (requestLimit) {
                        if (parseInt(requestLimit) > 0) {
                            await redis.decr(`${secretID}-requests`)

                            const preciseTimeToLive = await redis.pttl(`${secretID}-value`)

                            return responseWithLoadedAndRegexedHtmlFile('gui_secret.html', [
                                ['PRECISE_TIME_TO_LIVE', preciseTimeToLive.toString()],
                                ['SECRET_VALUE', Bun.escapeHTML(secretValue)]
                            ])
                        }

                        await redis.del(`${secretID}-requests`)
                    }

                    await redis.del(`${secretID}-value`)
                }
            }

            return responseWithLoadedAndRegexedHtmlFile('gui_message.html', [
                ['MESSAGE_VALUE', 'Gone']
            ])
        } catch (e) {
            console.error(e)

            return responseWithLoadedAndRegexedHtmlFile('gui_message.html', [
                ['MESSAGE_VALUE', 'Something went wrong']
            ])
        }
    },
} satisfies Serve
