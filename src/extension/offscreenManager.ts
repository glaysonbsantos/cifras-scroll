export interface OffscreenPlatform {
  resolveUrl(path: string): string
  findDocuments(url: string): Promise<unknown[]>
  createDocument(path: string): Promise<void>
  closeDocument(): Promise<void>
}

export class OffscreenDocumentManager {
  private creating: Promise<void> | null = null

  constructor(
    private readonly platform: OffscreenPlatform,
    private readonly path = '/offscreen.html',
  ) {}

  async ensureDocument(): Promise<void> {
    if (await this.hasDocument()) return
    if (this.creating) return this.creating

    this.creating = this.platform.createDocument(this.path)
    try {
      await this.creating
    } finally {
      this.creating = null
    }
  }

  async closeDocument(): Promise<void> {
    if (!await this.hasDocument()) return
    await this.platform.closeDocument()
  }

  private async hasDocument(): Promise<boolean> {
    const contexts = await this.platform.findDocuments(this.platform.resolveUrl(this.path))
    return contexts.length > 0
  }
}
