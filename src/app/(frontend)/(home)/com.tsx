"use client";
import { Comments } from "@fuma-comment/react";
const signIn = (string: any) => {
  console.log("first");
};
export function CommentsWithAuth() {
  return (
    <Comments
      page="default"
      auth={{
        type: "api",
        // function to sign in
        signIn: () => void signIn("github"),
      }}
    />
  );
}
