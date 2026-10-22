import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { PlanFeatureGate } from './plan-feature-gate';
const state = vi.hoisted(() => ({ path:'/forms', features:undefined as string[] | undefined }));
vi.mock('next/navigation', () => ({ usePathname: () => state.path }));
vi.mock('next/link', () => ({ default: ({children,href}:{children:React.ReactNode;href:string}) => React.createElement('a',{href},children) }));
vi.mock('@/hooks/use-profile', () => ({ useCurrentProfile: () => ({ data:{ role:['church_admin'],planFeatures:state.features } }) }));

describe('Plan feature gate', () => {
  it.each([undefined, []])('does not render premium children for missing/empty entitlements %s', features => {
    state.path='/forms'; state.features=features;
    const child=vi.fn(() => React.createElement('p',null,'Paid module content'));
    const html=renderToString(React.createElement(PlanFeatureGate,null,React.createElement(child)));
    expect(child).not.toHaveBeenCalled();
    expect(html).toContain('Community');
    expect(html).not.toContain('View historical records');
  });
  it('blocks Network-only ticket pages on Community even though events are included', () => {
    state.path='/events/management'; state.features=['events'];
    const html=renderToString(React.createElement(PlanFeatureGate,null,'Ticket management'));
    expect(html).toContain('Network');
    expect(html).not.toContain('Ticket management');
  });
  it('renders an included feature', () => {
    state.path='/forms'; state.features=['forms'];
    expect(renderToString(React.createElement(PlanFeatureGate,null,'Included form content'))).toContain('Included form content');
  });
});
