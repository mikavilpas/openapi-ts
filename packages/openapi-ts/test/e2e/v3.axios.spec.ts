import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { cleanup } from './scripts/cleanup'
import { compileWithTypescript } from './scripts/compileWithTypescript'
import { generateClient } from './scripts/generateClient'
import server from './scripts/server'

describe('v3.axios', () => {
  beforeAll(async () => {
    cleanup('v3/axios')
    await generateClient('v3/axios', 'v3', 'legacy/axios')
    compileWithTypescript('v3/axios')
    await server.start('v3/axios')
  }, 40000)

  afterAll(async () => {
    await server.stop()
  })

  it('requests token', async () => {
    const { OpenAPI, SimpleService } = await import(
      './generated/v3/axios/index.js'
    )
    const tokenRequest = vi.fn().mockResolvedValue('MY_TOKEN')
    OpenAPI.TOKEN = tokenRequest
    OpenAPI.USERNAME = undefined
    OpenAPI.PASSWORD = undefined
    const result = await SimpleService.getCallWithoutParametersAndResponse()
    expect(tokenRequest.mock.calls.length).toBe(1)
    // @ts-ignore
    expect(result.headers.authorization).toBe('Bearer MY_TOKEN')
  })

  it('uses credentials', async () => {
    const { OpenAPI, SimpleService } = await import(
      './generated/v3/axios/index.js'
    )
    OpenAPI.TOKEN = undefined
    OpenAPI.USERNAME = 'username'
    OpenAPI.PASSWORD = 'password'
    const result = await SimpleService.getCallWithoutParametersAndResponse()
    // @ts-ignore
    expect(result.headers.authorization).toBe('Basic dXNlcm5hbWU6cGFzc3dvcmQ=')
  })

  it('supports complex params', async () => {
    const { ComplexService } = await import('./generated/v3/axios/index.js')
    const result = await ComplexService.complexTypes({
      // @ts-ignore
      first: {
        second: {
          third: 'Hello World!'
        }
      }
    })
    expect(result).toBeDefined()
  })

  it('supports form data', async () => {
    const { ParametersService } = await import('./generated/v3/axios/index.js')
    // @ts-ignore
    const result = await ParametersService.callWithParameters(
      'valueHeader',
      // @ts-ignore
      'valueQuery',
      'valueForm',
      'valueCookie',
      'valuePath',
      {
        prop: 'valueBody'
      }
    )
    expect(result).toBeDefined()
  })

  it('can abort the request', async () => {
    let error
    try {
      const { SimpleService } = await import('./generated/v3/axios/index.js')
      const promise = SimpleService.getCallWithoutParametersAndResponse()
      setTimeout(() => {
        promise.cancel()
      }, 10)
      await promise
    } catch (e) {
      error = (e as Error).message
    }
    expect(error).toContain('Request aborted')
  })

  it('should throw known error (500)', async () => {
    let error
    try {
      const { ErrorService } = await import('./generated/v3/axios/index.js')
      // @ts-ignore
      await ErrorService.testErrorCode(500)
    } catch (err) {
      error = JSON.stringify({
        body: err.body,
        message: err.message,
        name: err.name,
        status: err.status,
        statusText: err.statusText,
        url: err.url
      })
    }
    expect(error).toBe(
      JSON.stringify({
        body: {
          message: 'hello world',
          status: 500
        },
        message: 'Custom message: Internal Server Error',
        name: 'ApiError',
        status: 500,
        statusText: 'Internal Server Error',
        url: 'http://localhost:3000/base/api/v1.0/error?status=500'
      })
    )
  })

  it('should throw unknown error (599)', async () => {
    let error
    try {
      const { ErrorService } = await import('./generated/v3/axios/index.js')
      // @ts-ignore
      await ErrorService.testErrorCode(599)
    } catch (err) {
      error = JSON.stringify({
        body: err.body,
        message: err.message,
        name: err.name,
        status: err.status,
        statusText: err.statusText,
        url: err.url
      })
    }
    expect(error).toBe(
      JSON.stringify({
        body: {
          message: 'hello world',
          status: 599
        },
        message:
          'Generic Error: status: 599; status text: unknown; body: {\n  "message": "hello world",\n  "status": 599\n}',
        name: 'ApiError',
        status: 599,
        statusText: 'unknown',
        url: 'http://localhost:3000/base/api/v1.0/error?status=599'
      })
    )
  })

  it('it should parse query params', async () => {
    const { ParametersService } = await import('./generated/v3/axios/index.js')
    const result = await ParametersService.postCallWithOptionalParam({
      // @ts-ignore
      page: 0,
      size: 1,
      sort: ['location']
    })
    // @ts-ignore
    expect(result.query).toStrictEqual({
      parameter: { page: '0', size: '1', sort: 'location' }
    })
  })
})

describe('v3.axios useOptions', () => {
  beforeAll(async () => {
    cleanup('v3/axios')
    await generateClient('v3/axios', 'v3', 'legacy/axios', true)
    compileWithTypescript('v3/axios')
    await server.start('v3/axios')
  }, 40000)

  afterAll(async () => {
    await server.stop()
  })

  it('returns result body by default', async () => {
    const { SimpleService } = await import('./generated/v3/axios/index.js')
    const result = await SimpleService.getCallWithoutParametersAndResponse()
    // @ts-ignore
    expect(result.body).toBeUndefined()
  })

  it('returns result body', async () => {
    const { SimpleService } = await import('./generated/v3/axios/index.js')
    // @ts-ignore
    const result = await SimpleService.getCallWithoutParametersAndResponse({
      _result: 'body'
    })
    // @ts-ignore
    expect(result.body).toBeUndefined()
  })

  it('returns raw result', async ({ skip }) => {
    skip()
    const { SimpleService } = await import('./generated/v3/axios/index.js')
    // @ts-ignore
    const result = await SimpleService.getCallWithoutParametersAndResponse({
      _result: 'raw'
    })
    // @ts-ignore
    expect(result.body).toBeDefined()
  })
})
