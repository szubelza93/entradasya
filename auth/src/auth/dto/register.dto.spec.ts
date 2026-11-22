import { isUserRole } from './register.dto.js';

describe('isUserRole', () => {
  it.each(['cliente', 'organizador', 'portero'])('accepts %s', (role) => {
    expect(isUserRole(role)).toBe(true);
  });

  it.each([undefined, null, '', 'admin', 'Organizador'])('rejects %s', (role) => {
    expect(isUserRole(role)).toBe(false);
  });
});
