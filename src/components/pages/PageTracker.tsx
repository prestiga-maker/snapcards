'use client';

import { useEffect } from 'react';

export function PageTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    fetch(`/api/pages/${pageId}/track`, { method: 'POST' }).catch(() => {});
  }, [pageId]);

  return null;
}
