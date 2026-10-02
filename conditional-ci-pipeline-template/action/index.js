const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  const label = core.getInput("label", { required: true });
  const token = core.getInput("github-token", { required: true });
  const octokit = github.getOctokit(token);
  const pr = github.context.payload.pull_request;

  if (!pr) {
    core.setOutput("matched", "false");
    core.info("No pull request in context; defaulting to false.");
    return;
  }

  const { data } = await octokit.rest.issues.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pr.number,
  });

  const matched = data.labels.some((l) => (typeof l === "string" ? l : l.name) === label);
  core.setOutput("matched", String(matched));
}

run().catch((err) => core.setFailed(err.message));
