import Link from "next/link";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { asAppError } from "@/lib/app-error";
import { getSessionFromCookies } from "@/lib/auth";
import { setCsrfCookie } from "@/lib/csrf";

import {
  Alert,
  BodyText,
  Button,
  Card,
  Heading,
  Input,
  Label,
  PageSection,
  Subheading,
  TextArea,
} from "@/components/ui/primitives";
import { logoutAction } from "@/features/auth/actions";
import { type AuthUser, getAccountUser } from "@/features/auth/service";
import {
  publishProfileAction,
  saveProfileDraftAction,
  unpublishProfileAction,
} from "@/features/profile/actions";
import { type OwnerProfile, getOwnerProfile } from "@/features/profile/service";

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
  let csrfTokenValue = "";
  let user: AuthUser | null = null;
  let profile: OwnerProfile | null = null;
  let verifiedNotice = false;
  let profileSavedNotice = false;
  let profilePublishedNotice = false;
  let profileUnpublishedNotice = false;
  let profileErrorMessage: string | null = null;
  let loadErrorCode: string | null = null;

  try {
    const session = await getSessionFromCookies();

    if (!session) {
      redirect("/login");
    }

    const [csrfToken, loadedUser, loadedProfile, params] = await Promise.all([
      setCsrfCookie(),
      getAccountUser(session.userId),
      getOwnerProfile(session.userId, session.username ?? ""),
      searchParams,
    ]);

    verifiedNotice = params.verified === "1";
    profileSavedNotice = params.profile_saved === "1";
    profilePublishedNotice = params.profile_published === "1";
    profileUnpublishedNotice = params.profile_unpublished === "1";

    const profileErrorCode =
      typeof params.profile_error === "string" ? params.profile_error : null;

    profileErrorMessage = readProfileError(profileErrorCode);
    csrfTokenValue = csrfToken.token;
    user = loadedUser;
    profile = loadedProfile;
  } catch (error: unknown) {
    if (isRedirectError(error)) {
      throw error;
    }

    const appError = asAppError(error, {
      code: "ACCOUNT_PAGE_LOAD_FAILED",
      message: "Unable to load account page.",
      statusCode: 500,
    });

    console.debug("[page] account render failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });

    loadErrorCode = appError.code;
  }

  if (loadErrorCode || !user || !profile) {
    return (
      <PageSection>
        <Heading>Account</Heading>
        <Alert tone="error" role="alert">
          Unable to load account right now. ({loadErrorCode ?? "ACCOUNT_PAGE_LOAD_FAILED"})
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Heading>Account</Heading>
      {verifiedNotice ? (
        <Alert tone="success" role="status">
          Email verified.
        </Alert>
      ) : null}
      {profileSavedNotice ? (
        <Alert tone="success" role="status">
          Profile draft saved.
        </Alert>
      ) : null}
      {profilePublishedNotice ? (
        <Alert tone="success" role="status">
          Profile published.
        </Alert>
      ) : null}
      {profileUnpublishedNotice ? (
        <Alert tone="info" role="status">
          Profile unpublished.
        </Alert>
      ) : null}
      {profileErrorMessage ? (
        <Alert tone="error" role="alert">
          {profileErrorMessage}
        </Alert>
      ) : null}
      <Card>
        <dl className="grid gap-3 text-sm">
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
      </Card>
      {!user.emailVerifiedAt ? (
        <BodyText>
          Your email is not verified. Use the verification token sent at signup on the{" "}
          <Link
            className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
            href="/verify-email"
          >
            verify email
          </Link>{" "}
          page.
        </BodyText>
      ) : null}
      <Card className="grid gap-4">
        <Subheading>Profile editor</Subheading>
        <BodyText>Status: {profile.isPublished ? "Published" : "Draft"}</BodyText>
        <form action={saveProfileDraftAction} className="grid gap-4">
          <input type="hidden" name="csrfToken" value={csrfTokenValue} />
          <Label>
            Display name
            <Input
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              maxLength={80}
            />
          </Label>
          <Label>
            Bio
            <TextArea
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={160}
              rows={3}
            />
          </Label>
          <Label>
            Website URL
            <Input
              name="websiteUrl"
              defaultValue={profile.websiteUrl ?? ""}
            />
          </Label>
          <Label>
            Avatar URL
            <Input
              name="avatarUrl"
              defaultValue={profile.avatarUrl ?? ""}
            />
          </Label>
          <Button type="submit">
            Save draft
          </Button>
        </form>
        {profile.isPublished ? (
          <form action={unpublishProfileAction}>
            <input type="hidden" name="csrfToken" value={csrfTokenValue} />
            <Button type="submit" variant="secondary">
              Unpublish profile
            </Button>
          </form>
        ) : (
          <form action={publishProfileAction}>
            <input type="hidden" name="csrfToken" value={csrfTokenValue} />
            <Button type="submit" variant="secondary">
              Publish profile
            </Button>
          </form>
        )}
      </Card>
      <Card>
        <form action={logoutAction}>
          <input type="hidden" name="csrfToken" value={csrfTokenValue} />
          <Button type="submit" variant="danger">
            Log out
          </Button>
        </form>
      </Card>
    </PageSection>
  );
}
