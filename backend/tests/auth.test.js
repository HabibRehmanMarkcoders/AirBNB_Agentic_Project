import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AppError } from '../src/utils/AppError.js'

describe('AppError', () => {
  it('stores statusCode and message', () => {
    const err = new AppError('Nope', 401)
    assert.equal(err.message, 'Nope')
    assert.equal(err.statusCode, 401)
    assert.equal(err.isOperational, true)
  })
})
