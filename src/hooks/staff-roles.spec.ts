import { describe, expect, it } from 'vitest';
import { VALID_ROLES, getRoleLabels } from './use-users';
import { ROLE_ORDER, sortRolesByOrder } from './use-roles';

describe('Staff login role catalog', () => {
  it('offers eight church staff roles with Church Admin first', () => {
    expect(VALID_ROLES).toHaveLength(8);
    expect(VALID_ROLES.map((r) => r.value)).not.toContain('member');
    expect(ROLE_ORDER).not.toContain('member');
    expect(VALID_ROLES[0].value).toBe('church_admin');
    expect(VALID_ROLES.map(r => r.value)).not.toContain('super_admin');
    expect(ROLE_ORDER).not.toContain('super_admin');
    expect(sortRolesByOrder(['super_admin', 'senior_pastor', 'member', 'media_team', 'church_admin'].map(roleName => ({ roleName }))).map(r => r.roleName)).toEqual(['church_admin', 'senior_pastor', 'media_team']);
    expect(getRoleLabels([])).toBe('No role assigned');
  });
});
