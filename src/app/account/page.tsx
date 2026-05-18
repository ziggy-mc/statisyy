import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionFromCookies } from "@/lib/auth";
import { setCsrfCookie } from "@/lib/csrf";

import { logoutAction } from "@/features/auth/actions";
import { getAccountUser } from "@/features/auth/service";
import {
  publishProfileAction,
  saveProfileDraftAction,
  unpublishProfileAction,
} from "@/features/profile/actions";
import { getOwnerProfile } from "@/features/profile/service";

type AccountPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const PROFILE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  PROFILE_NOT_FOUND: "Create and save a draft profile before publishing it.",
  VALIDATION_ERROR: "Please correct the profile values.",
  invalid_avatar_url: "Avatar URL must be a valid image URL.",
  invalid_url: "Website URL must be a valid HTTP or HTTPS URL.",
  too_long: "One or more profile fields are too long.",
};

function readProfileError(errorCode: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  return PROFILE_ERROR_MESSAGES[errorCode] ?? "Profile update failed. Please try again.";
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  const [csrfToken, user, profile, params] = await Promise.all([
    setCsrfCookie(),
    getAccountUser(session.userId),
    getOwnerProfile(session.userId, session.username ?? ""),
    searchParams,
  ]);

  const verifiedNotice = params.verified === "1";
  const profileSavedNotice = params.profile_saved === "1";
  const profilePublishedNotice = params.profile_published === "1";
  const profileUnpublishedNotice = params.profile_unpublished === "1";
  const profileErrorCode =
    typeof params.profile_error === "string" ? params.profile_error : null;
  const profileErrorMessage = readProfileError(profileErrorCode);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Account</h1>
      {verifiedNotice ? (
        <p className="border p-2 text-sm" role="status">
          Email verified.
        </p>
      ) : null}
      {profileSavedNotice ? (
        <p className="border p-2 text-sm" role="status">
          Profile draft saved.
        </p>
      ) : null}
      {profilePublishedNotice ? (
        <p className="border p-2 text-sm" role="status">
          Profile published.
        </p>
      ) : null}
      {profileUnpublishedNotice ? (
        <p className="border p-2 text-sm" role="status">
          Profile unpublished.
        </p>
      ) : null}
      {profileErrorMessage ? (
        <p className="border border-red-500 p-2 text-sm" role="alert">
          {profileErrorMessage}
        </p>
      ) : null}
      <dl className="grid gap-2 border p-4 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="font-medium">Username</dt>
          <dd>{user.username}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-medium">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-medium">Email status</dt>
          <dd>{user.emailVerifiedAt ? "Verified" : "Not verified"}</dd>
        </div>
      </dl>
      {!user.emailVerifiedAt ? (
        <p className="text-sm">
          Your email is not verified. Use the verification token sent at signup on the{" "}
          <Link className="underline" href="/verify-email">
            verify email
          </Link>{" "}
          page.
        </p>
      ) : null}
      <section className="grid gap-3 border p-4">
        <h2 className="text-base font-semibold">Profile editor</h2>
        <p className="text-sm">Status: {profile.isPublished ? "Published" : "Draft"}</p>
        <form action={saveProfileDraftAction} className="grid gap-3">
          <input type="hidden" name="csrfToken" value={csrfToken.token} />
          <label className="flex flex-col gap-1 text-sm">
            Display name
            <input
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              maxLength={80}
              className="border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Bio
            <textarea
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={160}
              rows={3}
              className="border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Website URL
            <input
              name="websiteUrl"
              defaultValue={profile.websiteUrl ?? ""}
              className="border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Avatar URL
            <input
              name="avatarUrl"
              defaultValue={profile.avatarUrl ?? ""}
              className="border px-2 py-1"
            />
          </label>
          <button type="submit" className="border px-3 py-2 text-sm">
            Save draft
          </button>
        </form>
        {profile.isPublished ? (
          <form action={unpublishProfileAction}>
            <input type="hidden" name="csrfToken" value={csrfToken.token} />
            <button type="submit" className="border px-3 py-2 text-sm">
              Unpublish profile
            </button>
          </form>
        ) : (
          <form action={publishProfileAction}>
            <input type="hidden" name="csrfToken" value={csrfToken.token} />
            <button type="submit" className="border px-3 py-2 text-sm">
              Publish profile
            </button>
          </form>
        )}
      </section>
      <form action={logoutAction} className="border p-4">
        <input type="hidden" name="csrfToken" value={csrfToken.token} />
        <button type="submit" className="border px-3 py-2 text-sm">
          Log out
        </button>
      </form>
    </section>
  );
}
