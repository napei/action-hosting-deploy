/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { endGroup, startGroup } from "@actions/core";
import { GitHub } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import {
  ChannelSuccessResult,
  interpretChannelDeployResult,
  ErrorResult,
} from "./deploy";

const BOT_SIGNATURE =
  "<sub>🔥 via [Firebase Hosting GitHub Action](https://github.com/marketplace/actions/deploy-to-firebase-hosting) 🌎</sub>";

export function isCommentByBot(comment): boolean {
  return comment.user.type === "Bot" && comment.body.includes(BOT_SIGNATURE);
}

export function getURLsMarkdownFromChannelDeployResult(
  result: ChannelSuccessResult
): string {
  const { urls } = interpretChannelDeployResult(result);

  return urls.length === 1
    ? `[${urls[0]}](${urls[0]})`
    : urls.map((url) => `- [${url}](${url})`).join("\n");
}

export function getChannelDeploySuccessComment(
  result: ChannelSuccessResult,
  commit: string
) {
  const urlList = getURLsMarkdownFromChannelDeployResult(result);
  const { expireTime } = interpretChannelDeployResult(result);

  return `
Visit the preview URL for this PR (updated for commit ${commit}):

${urlList}

<sub>(expires ${new Date(expireTime).toUTCString()})</sub>

${BOT_SIGNATURE}`.trim();
}

export async function postChannelSuccessComment(
  github: GitHub | undefined,
  context: Context,
  result: ChannelSuccessResult,
  commit: string
) {
  const commentMarkdown = getChannelDeploySuccessComment(result, commit);

  return postOrUpdateComment(github, context, commentMarkdown);
}

// create a PR comment, or update one if it already exists
async function postOrUpdateComment(
  github: GitHub | undefined,
  context: Context,
  commentMarkdown: string
) {
  if (!github) {
    console.log("GitHub object not available. Skipping PR comment.");
    return;
  }

  const commentInfo = {
    ...context.repo,
    issue_number: context.issue.number,
  };

  const comment = {
    ...commentInfo,
    body: commentMarkdown,
  };

  startGroup(`Commenting on PR`);
  let commentId;
  try {
    const comments = (await github.issues.listComments(commentInfo)).data;
    for (let i = comments.length; i--; ) {
      const c = comments[i];
      if (isCommentByBot(c)) {
        commentId = c.id;
        break;
      }
    }
  } catch (e) {
    console.log("Error checking for previous comments: " + e.message);
  }

  if (commentId) {
    try {
      await github.issues.updateComment({
        ...context.repo,
        comment_id: commentId,
        body: comment.body,
      });
    } catch (e) {
      commentId = null;
    }
  }

  if (!commentId) {
    try {
      await github.issues.createComment(comment);
    } catch (e) {
      console.log(`Error creating comment: ${e.message}`);
    }
  }
  endGroup();
}
