declare module 'turndown' {
  class TurndownService {
    constructor();
    turndown(html: string): string;
    addRule(
      name: string,
      rule: { filter: string; replacement: (content: string) => string }
    ): void;
  }

  export = TurndownService;
}
