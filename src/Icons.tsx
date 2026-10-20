import type { PageId } from './i18n';
export type IconName = PageId | 'grid' | 'folder' | 'search' | 'corner' | 'warning' | 'clock';
const shapes: Record<IconName, string> = {
 home: 'M3 10 12 3l9 7v11h-7v-7h-4v7H3Z',
 workspace: 'M3 3h18v18H3Zm2 4v2h14V7Zm3 4v8h2v-8Z',
 plugins: 'M5 3h4v2a2 2 0 0 0 4 0V3h6a2 2 0 0 1 2 2v4h-2a2 2 0 0 0 0 4h2v6a2 2 0 0 1-2 2h-6v-2a2 2 0 0 0-4 0v2H5a2 2 0 0 1-2-2v-6h2a2 2 0 0 0 0-4H3V5a2 2 0 0 1 2-2Z',
 settings: 'm10 3-.6 2.3-2 1.2-2.3-.6-2 3.4L4.8 11v2l-1.7 1.7 2 3.4 2.3-.6 2 1.2L10 21h4l.6-2.3 2-1.2 2.3.6 2-3.4-1.7-1.7v-2l1.7-1.7-2-3.4-2.3.6-2-1.2L14 3Zm5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 grid: 'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
 folder: 'M3 4h6l3 3h9v3H3Zm-1 8h20l-2 9H4Z',
 search: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM5 10a5 5 0 1 0 10 0 5 5 0 0 0-10 0Zm9 7 3-3 6 6-3 3Z',
 corner: 'M4 4h11a5 5 0 0 1 5 5v11',
 warning: 'm10.3 3-8 15A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-15a2 2 0 0 0-3.4 0Zm.9 5v6h1.6V8Zm0 8v2h1.6v-2Z',
 clock: 'M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0ZM11 6v7l5 3 .8-1.4-4.2-2.5V6Z',
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
 return <svg className={`icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{name === 'corner' ? <path d={shapes.corner} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : <path d={shapes[name]} fill="currentColor" fillRule="evenodd" />}</svg>;
}
