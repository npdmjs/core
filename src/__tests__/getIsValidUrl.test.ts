import { getIsValidUrl } from '../getIsValidUrl.js';

describe('getIsValidUrl', () => {
  describe('valid urls', () => {
    it.each([
      'http://www.example.com',
      'https://www.example.com',
      'http://example.com',
      'https://example.com',
      'http://www.example.com/product',
      'https://www.example.com/product',
      'http://example.com/product',
      'https://example.com/product',
      'http://www.example.com/product/',
      'https://www.example.com/product/',
      'http://example.com/product/',
      'https://example.com/product/',
      'http://localhost:4000',
      'https://localhost:4000',
      'http://localhost:4000/product',
      'https://localhost:4000/product',
      'http://localhost:4000/product/',
      'https://localhost:4000/product/',
      'http://10.12.13.14:4000',
      'https://10.12.13.14:5000',
    ])('%s', (url) => {
      expect(getIsValidUrl(url)).toBe(true);
    });
  });
});