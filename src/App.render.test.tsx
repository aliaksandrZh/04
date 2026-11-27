/**
 * SSR smoke test: renders the full App tree without crashing. Effects
 * (reminders polling, persistence) don't run under renderToString, but this
 * catches broken imports, hook misuse and render-time crashes.
 */

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App';

describe('App render smoke test', () => {
  it('renders the shell with quick-add, filter bar and task sections', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Todo');
    expect(html).toContain('Add a task');
    expect(html).toContain('Active');
    expect(html).toContain('Completed');
    expect(html).toContain('Enable notifications');
  });
});
