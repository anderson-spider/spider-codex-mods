import { expect, test } from 'vitest'
import { parseTokens } from '../src/tokens'

test('maps multiple hosts and rejects malformed or duplicate credentials', () => {
  expect(parseTokens('GitLab.com=first,gitlab.example.com:8443=second').tokens).toEqual(new Map([['gitlab.com', 'first'], ['gitlab.example.com:8443', 'second']]))
  for (const value of ['host=', 'host=ok,HOST=duplicate', 'https://host=token', 'host=first=second']) expect(parseTokens(value).off).toBe('bad-tokens')
  expect(parseTokens(undefined).off).toBe('no-tokens')
})
