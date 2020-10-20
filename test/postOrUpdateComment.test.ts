import {
  singleSiteComment,
  multiSiteComment,
  notABotComment,
} from "./samples/comments";
import {
  getChannelDeploySuccessComment,
  isCommentByBot,
} from "../src/postOrUpdateComment";
import { singleSiteSuccess, multiSiteSuccess } from "./samples/cliOutputs";

describe("postOrUpdateComment", () => {
  it("Creates the expected comment for a single site", () => {
    const comment = getChannelDeploySuccessComment(
      singleSiteSuccess,
      "fe211ff"
    );

    expect(comment).toEqual(singleSiteComment);
  });

  it("Creates the expected comment for multisite", () => {
    const comment = getChannelDeploySuccessComment(multiSiteSuccess, "fe211ff");

    expect(comment).toEqual(multiSiteComment);
  });

  it("Can tell if a comment has been written by itself", () => {
    const testComment = {
      user: { type: "Bot" },
      body: singleSiteComment,
    };
    expect(isCommentByBot(testComment)).toEqual(true);
  });

  it("Can tell if a comment has not been written by itself", () => {
    const testComment = {
      user: { type: "Bot" },
      body: notABotComment,
    };
    expect(isCommentByBot(testComment)).toEqual(false);
  });
});
