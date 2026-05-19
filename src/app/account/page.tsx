import Link from "next/link";
import { redirect } from "next/navigation";

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
          <input type="hidden" name="csrfToken" value={csrfToken.token} />
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
            <input type="hidden" name="csrfToken" value={csrfToken.token} />
            <Button type="submit" variant="secondary">
              Unpublish profile
            </Button>
          </form>
        ) : (
          <form action={publishProfileAction}>
            <input type="hidden" name="csrfToken" value={csrfToken.token} />
            <Button type="submit" variant="secondary">
              Publish profile
            </Button>
          </form>
        )}
      </Card>
      <Card>
        <form action={logoutAction}>
          <input type="hidden" name="csrfToken" value={csrfToken.token} />
          <Button type="submit" variant="danger">
            Log out
          </Button>
        </form>
      </Card>
    </PageSection>
  );
}
