'use client';
import { useState } from 'react';
import { request } from '../../lib/auth';
import { useAction, useResource } from '../../lib/use-resource';
import type { FeatureProps } from '../../lib/types';
import { useLanguage } from '../language';
import { ErrorNotice, Loading } from '../components/forms';
import { Icon } from '../ui';
export { default } from '../components/store-settings';

export function LineConnection({ base, guest }: FeatureProps) {
  const { t } = useLanguage();
  const { data, error, loading, reload } = useResource<{ line?: { configured?: boolean } }>(
    base + '/integrations'
  );
  const [link, setLink] = useState<{ code: string; instruction: string }>();
  const action = useAction();

  return (
    <div className="line-connection-page">
      <p className="screen-note">{t('lineNote')}</p>
      <ErrorNotice error={error || action.error} />
      {Boolean(error) && (
        <button className="secondary" onClick={() => void reload()}>
          {t('retry')}
        </button>
      )}
      {loading && <Loading />}

      <section className="panel line-panel">
        <div className="line-icon-large" aria-hidden="true">
          <Icon name="line" />
        </div>
        <h2>{t(data?.line?.configured ? 'configured' : 'notConfigured')}</h2>
        <p>{guest ? t('guestLine') : t('linkSteps')}</p>

        <button
          disabled={guest || !data?.line?.configured || action.busy}
          onClick={() => void action.run(async () => setLink(await request(base + '/line/link', {})))}
          className="button-primary"
        >
          {t('linkCode')}
        </button>

        {link && (
          <div className="link-code-box">
            <strong>{link.code}</strong>
            <p>{link.instruction}</p>
          </div>
        )}
      </section>
    </div>
  );
}
