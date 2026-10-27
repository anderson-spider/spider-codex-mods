---
name: gitlab
description: Work with GitLab merge requests, discussions, pipelines, jobs, labels and users in the current repository.
---

Use the GitLab MCP tools for GitLab work. Pass the absolute path of the current task's repository as `workspace` in every call. The server derives the host and project from its Git remote and the current branch. Use `project` only for another project on the same host.

Create merge requests as drafts by default. Set `allowOthers` only when the user requested a write on another person's merge request. Merge only on the user's explicit request, using the explicit IID and the full head SHA from status; respect all protected target guards. Never expose tokens or request them in chat. When credentials are missing, configure the personal file as described in the plugin README; never ask the user to paste a token into chat.
