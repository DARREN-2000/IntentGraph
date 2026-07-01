import { EC2Client, RunInstancesCommand, TerminateInstancesCommand } from "@aws-sdk/client-ec2";

export class AWSConnector {
  private client: EC2Client;

  constructor() {
    this.client = new EC2Client({ region: process.env.AWS_REGION || "us-east-1" });
  }

  async preview(actionDetails: any): Promise<any> {
    const isDestructive = actionDetails.action === 'delete' || actionDetails.action === 'terminate';
    return {
      status: 'success',
      preview: `Will perform AWS EC2 action: ${actionDetails.action}`,
      riskLevel: isDestructive ? 'high' : 'medium'
    };
  }

  async execute(actionDetails: any, idempotencyKey: string): Promise<any> {
    try {
        if (actionDetails.action === 'provision') {
            const command = new RunInstancesCommand({
                ImageId: actionDetails.imageId || "ami-0c55b159cbfafe1f0", // Amazon Linux 2 AMI
                InstanceType: actionDetails.instanceType || "t2.micro",
                MinCount: 1,
                MaxCount: 1,
                ClientToken: idempotencyKey // Idempotency key
            });
            const response = await this.client.send(command);
            return { status: 'success', result: response.Instances };
        } else if (actionDetails.action === 'terminate') {
             const command = new TerminateInstancesCommand({
                 InstanceIds: actionDetails.instanceIds
             });
             const response = await this.client.send(command);
             return { status: 'success', result: response.TerminatingInstances };
        }
        throw new Error("Unsupported AWS action");
    } catch (e: any) {
        return { status: 'failed', error: e.message };
    }
  }

  async compensate(actionDetails: any, idempotencyKey: string): Promise<any> {
     return { status: 'success', result: 'AWS action compensation logged.' };
  }
}
