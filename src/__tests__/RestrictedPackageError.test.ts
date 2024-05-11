import { RestrictedPackageError } from '../RestrictedPackageError.js';

describe('RestrictedPackageError', () => {
  it('should be an instance of Error', () => {
    const error = new RestrictedPackageError('foo', '1.0.0');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have a message', () => {
    const error = new RestrictedPackageError('foo', '1.0.0');
    expect(error.message).toBe('The package "foo@1.0.0" is restricted to load');
  });
});