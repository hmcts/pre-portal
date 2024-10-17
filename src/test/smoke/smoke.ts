import { fail } from 'assert';

import axios, { AxiosResponse } from 'axios';

const testUrl = process.env.TEST_URL || 'https://localhost:4551';

describe('Smoke Test', () => {
  describe('Terms and conditions page loads', () => {
    test('with correct content', async () => {
      try {
        const response: AxiosResponse = await axios.get(testUrl + '/accessibility-statement');
        expect(response.status).toBe(200);
        expect(response.data).toContain('<h1 class="govuk-heading-xl">Accessibility statement</h1>');
      } catch {
        fail('Heading not present and/or correct');
      }
    });
  });
});
