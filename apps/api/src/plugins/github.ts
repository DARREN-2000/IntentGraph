import { Octokit } from "@octokit/rest";

export class GitHubConnector {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }

  async preview(actionDetails: any): Promise<any> {
    return {
      status: 'success',
      preview: `Will perform GitHub repository action: ${actionDetails.action}`,
      riskLevel: 'low'
    };
  }

  async execute(actionDetails: any, idempotencyKey: string): Promise<any> {
      try {
        if (actionDetails.action === 'create_issue') {
            const response = await this.octokit.rest.issues.create({
                owner: actionDetails.owner,
                repo: actionDetails.repo,
                title: actionDetails.title,
                body: `Action created by GovernOS (Key: ${idempotencyKey})`
            });
            return { status: 'success', result: response.data.html_url };
        }
        throw new Error("Unsupported GitHub action");
      } catch (e: any) {
          return { status: 'failed', error: e.message };
      }
  }

  async compensate(actionDetails: any, idempotencyKey: string): Promise<any> {
      return { status: 'success', result: 'GitHub action compensation logged.' };
  }
}
