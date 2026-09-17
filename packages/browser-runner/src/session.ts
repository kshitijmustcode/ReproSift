import { randomUUID } from 'node:crypto';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export type BrowserLifecycleErrorCode =
  'SESSION_NOT_FOUND' | 'TARGET_NOT_ALLOWED' | 'BROWSER_OPERATION_FAILED';

export class BrowserLifecycleError extends Error {
  constructor(
    readonly code: BrowserLifecycleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BrowserLifecycleError';
  }
}

export type BrowserSessionManagerOptions = Readonly<{
  allowedBaseUrl: string;
  navigationTimeoutMs: number;
  screenshotTimeoutMs: number;
}>;

export type BrowserSessionNavigation = Readonly<{
  sessionId: string;
  url: string;
  title: string;
}>;

export type BrowserScreenshot = Readonly<{
  sessionId: string;
  contentType: 'image/png';
  base64: string;
  capturedAt: string;
}>;

type ManagedSession = Readonly<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
}>;

export class BrowserSessionManager {
  private readonly sessions = new Map<string, ManagedSession>();
  private readonly allowedOrigin: string;

  constructor(private readonly options: BrowserSessionManagerOptions) {
    const allowedBaseUrl = new URL(options.allowedBaseUrl);
    if (allowedBaseUrl.protocol !== 'http:' && allowedBaseUrl.protocol !== 'https:') {
      throw new Error('Browser allowedBaseUrl must use HTTP or HTTPS.');
    }
    this.allowedOrigin = allowedBaseUrl.origin;
  }

  async createSession(): Promise<string> {
    try {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        locale: 'en-US',
      });
      const page = await context.newPage();
      const sessionId = randomUUID();
      this.sessions.set(sessionId, { browser, context, page });
      return sessionId;
    } catch (error) {
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not create a browser session: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async navigate(sessionId: string, relativePath: string): Promise<BrowserSessionNavigation> {
    const session = this.requireSession(sessionId);
    const targetUrl = this.resolveAllowedUrl(relativePath);

    try {
      await session.page.goto(targetUrl, {
        timeout: this.options.navigationTimeoutMs,
        waitUntil: 'domcontentloaded',
      });
      return { sessionId, url: session.page.url(), title: await session.page.title() };
    } catch (error) {
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not navigate the browser session: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async captureScreenshot(sessionId: string): Promise<BrowserScreenshot> {
    const session = this.requireSession(sessionId);
    try {
      const screenshot = await session.page.screenshot({
        type: 'png',
        timeout: this.options.screenshotTimeoutMs,
      });
      return {
        sessionId,
        contentType: 'image/png',
        base64: screenshot.toString('base64'),
        capturedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not capture the browser screenshot: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.requireSession(sessionId);
    this.sessions.delete(sessionId);
    try {
      await session.context.close();
      await session.browser.close();
    } catch (error) {
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not close the browser session: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async closeAll(): Promise<void> {
    const sessionIds = [...this.sessions.keys()];
    await Promise.allSettled(sessionIds.map((sessionId) => this.closeSession(sessionId)));
  }

  private requireSession(sessionId: string): ManagedSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new BrowserLifecycleError('SESSION_NOT_FOUND', 'The browser session is unavailable.');
    }
    return session;
  }

  private resolveAllowedUrl(relativePath: string): string {
    if (!relativePath.startsWith('/') || relativePath.startsWith('//')) {
      throw new BrowserLifecycleError(
        'TARGET_NOT_ALLOWED',
        'Browser navigation must use an allowed relative path.',
      );
    }

    const target = new URL(relativePath, `${this.allowedOrigin}/`);
    if (target.origin !== this.allowedOrigin) {
      throw new BrowserLifecycleError(
        'TARGET_NOT_ALLOWED',
        'Browser navigation target is not allowed.',
      );
    }
    return target.toString();
  }

  private safeErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown browser error';
  }
}
