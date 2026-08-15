const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify';

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | undefined };
};

export async function verifyHcaptchaToken(
  token: string,
  req?: RequestLike
): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;

  if (!secret || !token) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (req?.headers?.['cf-connecting-ip']) {
    const cfIp = req.headers['cf-connecting-ip'];
    body.append('remoteip', Array.isArray(cfIp) ? cfIp[0] : cfIp);
  } else if (req?.headers?.['x-forwarded-for']) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0].trim();
    body.append('remoteip', ip);
  } else if (req?.socket?.remoteAddress) {
    body.append('remoteip', req.socket.remoteAddress);
  }


  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = (await response.json()) as { 
      success?: boolean; 
      'error-codes'?: string[];
      hostname?: string;
    };

    if (!data.success) {
      console.error('hCaptcha verification failed:', {
        errorCodes: data['error-codes'],
        hostname: data.hostname,
        tokenPrefix: token.substring(0, 10) + '...',
      });
    }

    return Boolean(data.success);
  } catch (error) {
    console.error('hCaptcha connection error:', error);
    return false;
  }
}
