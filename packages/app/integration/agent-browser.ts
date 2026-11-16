import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const CLI = join(dirname(require.resolve("agent-browser/package.json")), "bin/agent-browser.js");

type Response = { success: boolean; data: Record<string, unknown> | null; error: string | null };

export type A11yViolation = { id: string; impact: string | null; help: string };

/**
 * Drives the ephemeral app through the agent-browser CLI, the same tool agents use by hand.
 * Each instance owns one browser session; call close() when done.
 */
export class AgentBrowser {
  readonly session = `it-${randomUUID().slice(0, 8)}`;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async run(...args: string[]): Promise<Record<string, unknown>> {
    const { stdout } = await execFileAsync(
      process.execPath,
      [CLI, "--session", this.session, "--json", ...args],
      { maxBuffer: 16 * 1024 * 1024 },
    ).catch((error: { stdout?: string }) => ({ stdout: error.stdout ?? "" }));
    const response = JSON.parse(stdout) as Response;
    if (!response.success) {
      throw new Error(`agent-browser ${args.join(" ")}: ${response.error ?? "failed"}`);
    }
    return response.data ?? {};
  }

  async open(path: string): Promise<void> {
    await this.run("open", new URL(path, this.baseUrl).href);
  }

  async fill(label: string, value: string): Promise<void> {
    await this.run("find", "label", label, "fill", value);
  }

  async clickButton(name: string): Promise<void> {
    await this.run("find", "role", "button", "click", "--name", name);
  }

  async waitForText(text: string): Promise<void> {
    await this.run("wait", "--text", text);
  }

  async waitForPath(path: string): Promise<void> {
    await this.run("wait", "--url", `**${path}`);
  }

  async path(): Promise<string> {
    const { url } = await this.run("get", "url");
    return new URL(String(url)).pathname;
  }

  async title(): Promise<string> {
    const { title } = await this.run("get", "title");
    return String(title);
  }

  async headingText(level: number): Promise<string> {
    const { text } = await this.run("get", "text", `h${level}`);
    return String(text);
  }

  /** The value of the form control labelled `label`, waiting until that control is rendered. */
  async valueOf(label: string): Promise<string> {
    const control = `[...document.querySelectorAll("label")].find((l) => l.textContent.trim() === ${JSON.stringify(label)})?.control`;
    await this.run("wait", "--fn", `Boolean(${control})`);
    const { result } = await this.run("eval", `${control}?.value ?? null`);
    if (typeof result !== "string") throw new Error(`No form control labelled "${label}".`);
    return result;
  }

  async a11yViolations(): Promise<A11yViolation[]> {
    const { violations } = await this.run("a11y", "--tags", "wcag2a,wcag2aa");
    return violations as A11yViolation[];
  }

  async close(): Promise<void> {
    await this.run("close");
  }
}
