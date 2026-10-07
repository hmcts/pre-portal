import { validateId } from '../../../main/helpers/helpers';

describe('validateId', () => {
  test.each([
    '123e4567-e89b-12d3-a456-426614174000',
    '123E4567-E89B-12D3-A456-426614174000',
    'aBcDeF12-3456-7890-AbCd-Ef1234567890',
  ])('returns true for valid UUID: %s', id => {
    expect(validateId(id)).toBe(true);
  });

  test.each([
    '123e4567e89b12d3a456426614174000', // no hyphens
    '123e4567-e89b-12d3-a456-42661417400', // too short
    '123e4567-e89b-12d3-a456-4266141740000', // too long
    '123e4567-e89b-12d3-a456-42661417400g', // non-hex
    '123e4567-e89b12d3-a456-426614174000', // misplaced hyphen
    ' 123e4567-e89b-12d3-a456-426614174000', // leading space
    '',
  ])('returns false for invalid UUID: %s', id => {
    expect(validateId(id)).toBe(false);
  });
});
