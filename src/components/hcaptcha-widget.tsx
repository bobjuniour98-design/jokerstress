'use client';

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react';

declare global {
  interface Window {
    hcaptcha?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'dark' | 'light';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface HCaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}

export interface HCaptchaWidgetHandle {
  reset: () => void;
}

const HCaptchaWidget = forwardRef<HCaptchaWidgetHandle, HCaptchaWidgetProps>((
  { onVerify, onExpire, className },
  ref
) => {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.hcaptcha && widgetIdRef.current) {
        window.hcaptcha.reset(widgetIdRef.current);
      }
    },
  }));

  // Update refs when props change without re-running the render effect
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onVerify, onExpire]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    if (!siteKey || !containerEl) {
      return;
    }

    const renderWidget = () => {
      if (!window.hcaptcha || !containerEl || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.hcaptcha.render(containerEl, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => {
          onVerifyRef.current('');
          onExpireRef.current?.();
        },
        'error-callback': () => {
          onVerifyRef.current('');
          onExpireRef.current?.();
        },
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.hcaptcha.com/1/api.js"]'
    );

    if (existingScript) {
      if (window.hcaptcha) {
        renderWidget();
      } else {
        existingScript.addEventListener('load', renderWidget, { once: true });
      }
    } else {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.body.appendChild(script);
    }

    return () => {
      if (window.hcaptcha && widgetIdRef.current) {
        try {
          window.hcaptcha.remove(widgetIdRef.current);
        } catch (e) {
          console.error('Error removing hCaptcha:', e);
        }
        widgetIdRef.current = null;
      }
    };
  }, [containerEl]);

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  if (!siteKey) {
    return (
      <div
        className={`rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-center text-xs text-amber-200/90 ${className ?? ''}`}
      >
        hCaptcha is not configured. Set{' '}
        <span className="font-mono text-amber-100">NEXT_PUBLIC_HCAPTCHA_SITE_KEY</span> and{' '}
        <span className="font-mono text-amber-100">HCAPTCHA_SECRET_KEY</span> in your environment.
      </div>
    );
  }

  return <div ref={setContainerRef} className={className} />;
});

HCaptchaWidget.displayName = 'HCaptchaWidget';

export default HCaptchaWidget;
