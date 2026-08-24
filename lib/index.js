/**
 * dsh-deepseek-balance 宿主端。
 *
 * 挂载 /dsh-deepseek-balance/* 路由：读取本机保存的 API 密钥，调用
 * DeepSeek 官方余额接口（GET https://api.deepseek.com/user/balance），
 * 并把结果回传给浏览器端设置页。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'

export const name = 'dsh-deepseek-balance'

const API_URL = 'https://api.deepseek.com/user/balance'

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function keyFilePath() {
  return join(dshHome(), 'storages', 'dsh-deepseek-balance', 'key.txt')
}

function readKey() {
  try {
    return readFileSync(keyFilePath(), 'utf8').trim()
  } catch {
    return ''
  }
}

function writeKey(key) {
  const file = keyFilePath()
  mkdirSync(dirname(file), { recursive: true })
  try {
    if (key === '') {
      writeFileSync(file, '', { mode: 0o600 })
    } else {
      writeFileSync(file, key, { mode: 0o600 })
    }
  } catch {
    // 密钥写入失败不致命，仅影响后续查询。
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

function sameOrigin(req) {
  const origin = req.headers.origin
  const host = req.headers.host
  if (origin === undefined || host === undefined) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return text === '' ? {} : JSON.parse(text)
}

async function fetchBalance(apiKey) {
  const res = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      body && body.error && typeof body.error.message === 'string'
        ? body.error.message
        : `HTTP ${res.status}`
    return { ok: false, error: message, status: res.status }
  }
  return { ok: true, status: res.status, ...body }
}

export function apply(ctx) {
  ctx.inject(['webServer'], (scoped) => {
    const server = scoped.webServer

    const route = (method, path, handler) =>
      server.register({
        kind: 'exact',
        path,
        handler: async (req, res) => {
          if (req.method !== method) {
            res.writeHead(405, { allow: method })
            res.end()
            return
          }
          try {
            await handler(req, res)
          } catch (error) {
            sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
          }
        },
      })

    route('GET', '/dsh-deepseek-balance/status', async (req, res) => {
      sendJson(res, 200, { configured: readKey() !== '' })
    })

    route('GET', '/dsh-deepseek-balance/balance', async (req, res) => {
      const key = readKey()
      if (key === '') {
        sendJson(res, 200, { ok: false, error: 'not-configured' })
        return
      }
      sendJson(res, 200, await fetchBalance(key))
    })

    route('POST', '/dsh-deepseek-balance/key', async (req, res) => {
      if (!sameOrigin(req)) {
        sendJson(res, 403, { error: 'untrusted origin' })
        return
      }
      const body = await readJsonBody(req)
      const key = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
      if (key === '') {
        sendJson(res, 400, { error: 'empty-key' })
        return
      }
      const check = await fetchBalance(key)
      if (!check.ok) {
        sendJson(res, 400, { error: check.error })
        return
      }
      writeKey(key)
      sendJson(res, 200, { ok: true })
    })

    route('POST', '/dsh-deepseek-balance/clear', async (req, res) => {
      if (!sameOrigin(req)) {
        sendJson(res, 403, { error: 'untrusted origin' })
        return
      }
      writeKey('')
      sendJson(res, 200, { ok: true })
    })
  })
}
