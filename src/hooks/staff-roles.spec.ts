import { describe, expect, it } from 'vitest';
import { VALID_ROLES, getRoleLabels } from './use-users';
import { ROLE_ORDER } from './use-roles';

describe('Staff login role catalog', () => {
  it('offers nine staff roles and no member login role', () => {
    expect(VALID_ROLES).toHaveLength(9);
    expect(VALID_ROLES.map((r) => r.value)).not.toContain('member');
    expect(ROLE_ORDER).not.toContain('member');
    expect(getRoleLabels([])).toBe('No role assigned');
  });
});
