import { randomUUID } from 'node:crypto';
import { chromium, type Browser, type BrowserContext, type Locator, type Page } from 'playwright';

export type BrowserLifecycleErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'TARGET_NOT_ALLOWED'
  | 'EXECUTION_LIMIT_REACHED'
  | 'BROWSER_OPERATION_FAILED';

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
  maxActions: number;
}>;

export type BrowserSessionNavigation = Readonly<{
  sessionId: string;
  url: string;
  title: string;
}>;

export type BrowserSessionReset = BrowserSessionNavigation;

export type BrowserScreenshot = Readonly<{
  sessionId: string;
  contentType: 'image/png';
  base64: string;
  capturedAt: string;
}>;

export type BrowserLocator =
  | Readonly<{
      strategy: 'role';
      role: 'button' | 'combobox' | 'link' | 'textbox';
      name: string;
    }>
  | Readonly<{ strategy: 'label'; label: string }>
  | Readonly<{ strategy: 'test_id'; testId: string }>;

export type BrowserPageInspection = Readonly<{
  sessionId: string;
  url: string;
  title: string;
  visibleText: string;
}>;

export type BrowserActionResult = Readonly<{
  sessionId: string;
  action: 'click' | 'fill' | 'select';
  url: string;
  title: string;
}>;

export type BrowserEvidence = Readonly<{
  artifactId: string;
  sessionId: string;
  screenshot: BrowserScreenshot;
  actions: readonly string[];
  consoleMessages: readonly string[];
  networkRequests: readonly string[];
}>;

type ManagedSession = Readonly<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
  actions: string[];
  consoleMessages: string[];
  networkRequests: string[];
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
      const actions: string[] = [];
      const consoleMessages: string[] = [];
      const networkRequests: string[] = [];
      page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.origin === this.allowedOrigin)
          networkRequests.push(`${request.method()} ${url.pathname}`);
      });
      this.sessions.set(sessionId, {
        browser,
        context,
        page,
        actions,
        consoleMessages,
        networkRequests,
      });
      return sessionId;
    } catch (error) {
      if (error instanceof BrowserLifecycleError) throw error;
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
      this.assertActionBudget(session);
      await session.page.goto(targetUrl, {
        timeout: this.options.navigationTimeoutMs,
        waitUntil: 'domcontentloaded',
      });
      session.actions.push(`navigate ${relativePath}`);
      return { sessionId, url: session.page.url(), title: await session.page.title() };
    } catch (error) {
      if (error instanceof BrowserLifecycleError) throw error;
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not navigate the browser session: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async resetSession(sessionId: string, relativePath: string): Promise<BrowserSessionReset> {
    const session = this.requireSession(sessionId);
    const targetUrl = this.resolveAllowedUrl(relativePath);

    try {
      this.assertActionBudget(session);
      await session.context.clearCookies();
      await session.page.goto(targetUrl, {
        timeout: this.options.navigationTimeoutMs,
        waitUntil: 'domcontentloaded',
      });
      await session.page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await session.page.reload({
        timeout: this.options.navigationTimeoutMs,
        waitUntil: 'domcontentloaded',
      });
      session.actions.push(`reset ${relativePath}`);
      return { sessionId, url: session.page.url(), title: await session.page.title() };
    } catch (error) {
      if (error instanceof BrowserLifecycleError) throw error;
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not reset the browser session: ${this.safeErrorMessage(error)}`,
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
      if (error instanceof BrowserLifecycleError) throw error;
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not capture the browser screenshot: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async collectEvidence(sessionId: string): Promise<BrowserEvidence> {
    const session = this.requireSession(sessionId);
    const screenshot = await this.captureScreenshot(sessionId);
    return {
      artifactId: randomUUID(),
      sessionId,
      screenshot,
      actions: [...session.actions],
      consoleMessages: [...session.consoleMessages],
      networkRequests: [...session.networkRequests],
    };
  }

  async inspectPage(sessionId: string): Promise<BrowserPageInspection> {
    const session = this.requireSession(sessionId);
    try {
      return {
        sessionId,
        url: session.page.url(),
        title: await session.page.title(),
        visibleText: (await session.page.locator('body').innerText()).slice(0, 12_000),
      };
    } catch (error) {
      if (error instanceof BrowserLifecycleError) throw error;
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not inspect the browser page: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async readTargetText(sessionId: string, target: BrowserLocator): Promise<string> {
    const session = this.requireSession(sessionId);
    try {
      return await this.resolveLocator(session.page, target).innerText({
        timeout: this.options.navigationTimeoutMs,
      });
    } catch (error) {
      if (error instanceof BrowserLifecycleError) throw error;
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not read the browser target: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async click(sessionId: string, target: BrowserLocator): Promise<BrowserActionResult> {
    const session = this.requireSession(sessionId);
    try {
      this.assertActionBudget(session);
      await this.resolveLocator(session.page, target).click({
        timeout: this.options.navigationTimeoutMs,
      });
      session.actions.push(`click ${target.strategy}`);
      return this.actionResult(sessionId, 'click', session.page);
    } catch (error) {
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not click the browser target: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async fill(
    sessionId: string,
    target: BrowserLocator,
    value: string,
  ): Promise<BrowserActionResult> {
    const session = this.requireSession(sessionId);
    try {
      this.assertActionBudget(session);
      await this.resolveLocator(session.page, target).fill(value, {
        timeout: this.options.navigationTimeoutMs,
      });
      session.actions.push(`fill ${target.strategy}`);
      return this.actionResult(sessionId, 'fill', session.page);
    } catch (error) {
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not fill the browser target: ${this.safeErrorMessage(error)}`,
      );
    }
  }

  async select(
    sessionId: string,
    target: BrowserLocator,
    value: string,
  ): Promise<BrowserActionResult> {
    const session = this.requireSession(sessionId);
    try {
      this.assertActionBudget(session);
      await this.resolveLocator(session.page, target).selectOption(value, {
        timeout: this.options.navigationTimeoutMs,
      });
      session.actions.push(`select ${target.strategy}`);
      return this.actionResult(sessionId, 'select', session.page);
    } catch (error) {
      throw new BrowserLifecycleError(
        'BROWSER_OPERATION_FAILED',
        `Could not select the browser target: ${this.safeErrorMessage(error)}`,
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

  private assertActionBudget(session: ManagedSession): void {
    if (session.actions.length >= this.options.maxActions) {
      throw new BrowserLifecycleError(
        'EXECUTION_LIMIT_REACHED',
        `Browser session exceeded its ${this.options.maxActions}-action limit.`,
      );
    }
  }

  private resolveLocator(page: Page, target: BrowserLocator): Locator {
    switch (target.strategy) {
      case 'role':
        return page.getByRole(target.role, { exact: true, name: target.name });
      case 'label':
        return page.getByLabel(target.label, { exact: true });
      case 'test_id':
        return page.getByTestId(target.testId);
    }
  }

  private async actionResult(
    sessionId: string,
    action: BrowserActionResult['action'],
    page: Page,
  ): Promise<BrowserActionResult> {
    return { sessionId, action, url: page.url(), title: await page.title() };
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
