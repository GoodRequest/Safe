import * as zlib from 'zlib'
import { promisify } from 'util'
import { type Serve } from 'bun'
import Redis from 'ioredis'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/*
    Clients
*/

const redisClient = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
    retryStrategy: (times: number) => Math.min(times * 100, 30_000)
})

const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION || 'eu-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
})

/*
    AWS S3
*/

const uploadFileToS3 = async (bucketName: string, fileName: string, buffer: Buffer, minutes: number) => {
    await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: 'application/zip'
    }))

    return getSignedUrl(
        s3Client,
        new GetObjectCommand({
            Bucket: bucketName,
            Key: fileName
        }),
        { expiresIn: minutes * 60 }
    )
}

const deleteS3Object = async (bucketName: string, fileName: string) => {
    await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName
    }))
}

/*
    Utils
*/

const responseWithLoadedAndRegexedHtmlFile = async (fileName: string, replacements?: Array<Array<string>>) => {
    let fileContent = await Bun.file(import.meta.dir + '/' + fileName).text()

    if (replacements && replacements.length) {
        replacements.forEach(([pattern, value]) => {
            // Replace all occurrences as literal strings to prevent regex injection
            fileContent = fileContent.split(pattern).join(value)
        })
    }

    return new Response(fileContent, { headers: { 'Content-Type': 'text/html' } })
}

const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0

    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024
        i++
    }

    return `${bytes.toFixed(2)} ${units[i]}`
}

/*
    Backend
*/

export default {
    port: process.env.PORT || 8000,
    fetch: async (req) => {
        try {
            const { url, method, body } = req
            const { pathname } = new URL(url)

            if (pathname === '/favicon.png') {
                return new Response(Bun.file('./favicon.png'))
            }

            if (pathname === '/') {
                if (method === 'GET') {
                    return responseWithLoadedAndRegexedHtmlFile('gui_landing.html')
                }
            }

            if (pathname === '/') {
                if (method === 'POST' && body) {
                    const formData = await req.formData()

                    const internal = formData.get('internal')
                    const internalPath = process.env.INTERNAL_PATH || 'internal'
                    const secretID = `${internal?.toString() === 'true' ? internalPath + '/' : ''}${crypto.randomUUID()}`

                    const secret = formData.get('secret')
                    const timeLimitInMinutes = parseInt(formData.get('timeLimitInMinutes')?.toString() || '0', 10)
                    if (secret !== undefined && secret !== null) {
                        await redisClient.set(`${secretID}-secret`, secret.toString(), 'EX', timeLimitInMinutes * 60)
                    }

                    const requestLimit = formData.get('requestLimit')
                    if (requestLimit !== undefined && requestLimit !== null) {
                        await redisClient.set(`${secretID}-requests`, requestLimit.toString(), 'EX', timeLimitInMinutes * 60)
                    }

                    const file = formData.get('file') as any
                    if (file !== undefined && file !== null) {
                        const fileName = file.valueOf().name
                        const buffer = Buffer.from(await file.arrayBuffer()) 

                        if (buffer.length > 30 * (1024 ** 2)) {
                            throw new Error('File size must be 30MB or less.')
                        }

                        const preSignedUrl = await uploadFileToS3(process.env.AWS_S3_BUCKET_NAME || '', `${fileName}.gzip`, await promisify(zlib.gzip)(buffer), timeLimitInMinutes)

                        await Promise.all([
                            redisClient.set(`${secretID}-preSignedUrl`, preSignedUrl, 'EX', timeLimitInMinutes * 60),
                            redisClient.set(`${secretID}-fileName`, fileName, 'EX', timeLimitInMinutes * 60),
                            redisClient.set(`${secretID}-fileSize`, formatFileSize(buffer.length), 'EX', timeLimitInMinutes * 60)
                        ])

                        setTimeout(() => deleteS3Object(process.env.AWS_S3_BUCKET_NAME || '', fileName).catch(), timeLimitInMinutes * 60 * 1_000)
                    }

                    return new Response(secretID)
                }
            }

            const secretID = pathname.substring(1)
            if (secretID) {
                const [
                    secretValue,
                    requestLimit,
                    preSignedUrlValue,
                    fileNameValue,
                    fileSizeValue
                ] = await Promise.all([
                    redisClient.get(`${secretID}-secret`),
                    redisClient.get(`${secretID}-requests`),
                    redisClient.get(`${secretID}-preSignedUrl`),
                    redisClient.get(`${secretID}-fileName`),
                    redisClient.get(`${secretID}-fileSize`)
                ])

                const regexedArray = []

                if (requestLimit) {
                    if (parseInt(requestLimit) > 0) {
                        if (secretValue) {
                            const preciseTimeToLive = await redisClient.pttl(`${secretID}-secret`)

                            regexedArray.push(
                                ['SECRET_VALUE', Bun.escapeHTML(secretValue)],
                                ['PRECISE_TIME_TO_LIVE', preciseTimeToLive.toString()]
                            )
                        }

                        if (preSignedUrlValue && fileNameValue) {
                            const preciseTimeToLive = await redisClient.pttl(`${secretID}-preSignedUrl`)

                            regexedArray.push(
                                ['PRESIGNED_URL_VALUE', Bun.escapeHTML(preSignedUrlValue)],
                                ['FILE_NAME_VALUE', Bun.escapeHTML(`${fileNameValue} (${fileSizeValue})`)],
                                ['PRECISE_TIME_TO_LIVE', preciseTimeToLive.toString()]
                            )
                        }

                        await redisClient.decr(`${secretID}-requests`)

                        return responseWithLoadedAndRegexedHtmlFile('gui_secret.html', regexedArray)
                    }

                    await redisClient.del(`${secretID}-requests`)
                }

                if (fileNameValue) {
                    await deleteS3Object(process.env.AWS_S3_BUCKET_NAME || '', fileNameValue || '')
                }

                await Promise.all([
                    redisClient.del(`${secretID}-requests`),
                    redisClient.del(`${secretID}-secret`),
                    redisClient.del(`${secretID}-preSignedUrl`),
                    redisClient.del(`${secretID}-fileName`),
                    redisClient.del(`${secretID}-fileSize`)
                ])
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
