#!/usr/bin/env node
import { parseArgs } from "node:util";

interface AlertPayload {
  pipelineName: string;
  jobName: string;
  buildUrl: string;
  status: "failed" | "recovered";
}

function buildSlackMessage(payload: AlertPayload): object {
  const emoji = payload.status === "failed" ? ":red_circle:" : ":large_green_circle:";
  const verb = payload.status === "failed" ? "failed" : "recovered";
  return {
    text: `${emoji} *${payload.pipelineName}* / ${payload.jobName} ${verb}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${payload.pipelineName}* / \`${payload.jobName}\` ${verb}\n<${payload.buildUrl}|View build>`,
        },
      },
    ],
  };
}

async function postToSlack(webhookUrl: string, payload: AlertPayload): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSlackMessage(payload)),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook responded with ${response.status}: ${await response.text()}`);
  }
}

function printHelp(): void {
  console.log(`slack-ci-alert --webhook-url <url> --pipeline <name> --job <name> --build-url <url> --status <failed|recovered>

Lets any CI system post a failure/recovery alert to Slack via an incoming
webhook, without needing a native Slack integration plugin installed on
the CI server (useful when you don't have admin rights on the runner).`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "webhook-url": { type: "string" },
      pipeline: { type: "string" },
      job: { type: "string" },
      "build-url": { type: "string" },
      status: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help || !values["webhook-url"] || !values.pipeline || !values.job || !values["build-url"] || !values.status) {
    printHelp();
    process.exit(values.help ? 0 : 1);
  }

  await postToSlack(values["webhook-url"]!, {
    pipelineName: values.pipeline!,
    jobName: values.job!,
    buildUrl: values["build-url"]!,
    status: values.status as "failed" | "recovered",
  });

  console.log("Alert posted to Slack.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
