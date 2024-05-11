import { PackageMatcher } from '../PackageMatcher.js';

describe('PackageMatcher', () => {
  it.each([
    { name: 'foo', version: '1.0.0', matchers: [], expected: false },
    { name: 'foo', version: '1.0.0', matchers: [{ name: 'foo', version: '1.0.0' }], expected: true },
    { name: 'foo', version: '1.0.0', matchers: [{ name: 'foo' }], expected: true },
    { name: 'foo', version: '1.0.0', matchers: [{ version: '1.0.0' }], expected: true },
    { name: 'foo', version: '1.0.0', matchers: [{ name: 'foo', version: '2.0.0' }], expected: false },
    { name: 'foo', version: '1.0.0', matchers: [{ name: 'foobar', version: '1.0.0' }], expected: false },
    { name: 'foo', version: '1.0.0', matchers: [{ name: 'bar', version: '2.0.0' }], expected: false },
    { name: 'foo', version: '1.0.0', matchers: [{ name: 'bar', version: /1\.\d\.\d/ }], expected: false },
    { name: 'foo', version: '1.0.0', matchers: [{ name: /foo/, version: '1.0.0' }], expected: true },
    { name: 'foo', version: '1.0.0', matchers: [{ name: /bar/, version: '1.0.0' }], expected: false },
    { name: 'foo', version: '1.0.0', matchers: [{ name: /foo/, version: '2.0.0' }], expected: false },
    { name: 'foo', version: '1.2.7', matchers: [{ name: 'foo', version: /1\.\d+\.\d+/ }], expected: true },
    { name: 'foo', version: '2.2.7', matchers: [{ name: 'foo', version: /1\.\d+\.\d+/ }], expected: false },
    { name: 'foobar', version: '1.0.0', matchers: [{ name: /foo/, version: '1.0.0' }], expected: true },
    { name: 'foobar', version: '1.0.0', matchers: [{ name: /^foo$/, version: '1.0.0' }], expected: false },
  ])('getIsMatched($name, $version, $matchers) === $expected', ({ name, version, matchers, expected }) => {
    const packageMatcher = new PackageMatcher();
    expect(packageMatcher.getIsMatched(name, version, matchers)).toBe(expected);
  });
});