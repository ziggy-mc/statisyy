import { asAppError } from "@/lib/app-error";
import { setCsrfCookie } from "@/lib/csrf";

import { Alert, BodyText, Button, Card, Heading, PageSection } from "@/components/ui/primitives";
import { logoutAction } from "@/features/auth/actions";

export default async function LogoutPage() {
  let csrfTokenValue = "";
  let loadErrorCode: string | null = null;

  try {
    const csrfToken = await setCsrfCookie();
    csrfTokenValue = csrfToken.token;
  } catch (error: unknown) {
    const appError = asAppError(error, {
      code: "LOGOUT_PAGE_LOAD_FAILED",
      message: "Unable to load logout page.",
      statusCode: 500,
    });

    console.debug("[page] logout render failed", {
      code: appError.code,
      statusCode: appError.statusCode,
    });
    loadErrorCode = appError.code;
  }

  if (loadErrorCode) {
    return (
      <PageSection>
        <Heading>Log out</Heading>
        <Alert tone="error" role="alert">
          Unable to load logout right now. ({loadErrorCode})
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Heading>Log out</Heading>
      <BodyText>Confirm to end your current session.</BodyText>
      <Card>
        <form action={logoutAction} className="flex flex-col gap-4">
          <input type="hidden" name="csrfToken" value={csrfTokenValue} />
          <Button type="submit" variant="danger">
            Confirm logout
          </Button>
        </form>
      </Card>
    </PageSection>
  );
}
