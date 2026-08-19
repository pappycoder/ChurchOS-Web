"use client";

function BaseThumb({ sidebar = true, header = true, mini = false, children }: {
  sidebar?: boolean;
  header?: boolean;
  mini?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="40" rx="3" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5" />
      {header && <rect x="0" y="0" width="60" height="6" fill="#2563EB" opacity="0.15" />}
      {sidebar && (
        <rect x="0" y={header ? 6 : 0} width={mini ? 8 : 14} height={header ? 34 : 40} fill="#2563EB" opacity="0.25" />
      )}
      {children}
    </svg>
  );
}

export function DefaultThumb() {
  return (
    <BaseThumb>
      <rect x="18" y="10" width="36" height="26" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function MiniThumb() {
  return (
    <BaseThumb mini>
      <rect x="12" y="10" width="42" height="26" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function HorizontalThumb() {
  return (
    <BaseThumb sidebar={false}>
      <rect x="2" y="8" width="56" height="4" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="2" y="16" width="56" height="22" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function HorizontalSingleThumb() {
  return (
    <BaseThumb sidebar={false}>
      <rect x="2" y="8" width="56" height="3" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="2" y="14" width="56" height="24" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function DetachedThumb() {
  return (
    <BaseThumb sidebar={false}>
      <rect x="4" y="8" width="52" height="3" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="4" y="14" width="52" height="22" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function TwoColumnThumb() {
  return (
    <BaseThumb sidebar={false}>
      <rect x="2" y="8" width="56" height="4" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="2" y="15" width="26" height="22" rx="1" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
      <rect x="32" y="15" width="26" height="22" rx="1" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function WithoutHeaderThumb() {
  return (
    <BaseThumb>
      <rect x="18" y="10" width="36" height="26" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function OverlayThumb() {
  return (
    <BaseThumb sidebar={false}>
      <rect x="2" y="8" width="56" height="4" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="0" y="8" width="20" height="30" rx="1" fill="#2563EB" opacity="0.3" />
      <rect x="24" y="15" width="32" height="21" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function MenuAsideThumb() {
  return (
    <BaseThumb sidebar={false}>
      <rect x="2" y="8" width="56" height="3" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="2" y="14" width="8" height="24" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="14" y="14" width="42" height="24" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function StackedThumb() {
  return (
    <BaseThumb sidebar={false}>
      <rect x="2" y="8" width="56" height="3" rx="1" fill="#2563EB" opacity="0.2" />
      <rect x="2" y="13" width="56" height="3" rx="1" fill="#2563EB" opacity="0.15" />
      <rect x="2" y="19" width="56" height="19" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function ModernThumb() {
  return (
    <BaseThumb>
      <rect x="18" y="10" width="36" height="26" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function TransparentThumb() {
  return (
    <BaseThumb>
      <rect x="18" y="10" width="36" height="26" rx="2" fill="#fff" fillOpacity="0.5" stroke="#E5E7EB" strokeWidth="0.5" />
    </BaseThumb>
  );
}

export function RtlThumb() {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="40" rx="3" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="0.5" />
      <rect x="0" y="0" width="60" height="6" fill="#2563EB" opacity="0.15" />
      <rect x="46" y="6" width="14" height="34" fill="#2563EB" opacity="0.25" />
      <rect x="6" y="10" width="36" height="26" rx="2" fill="#fff" stroke="#E5E7EB" strokeWidth="0.5" />
    </svg>
  );
}
