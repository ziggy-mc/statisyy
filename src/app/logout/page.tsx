import { asAppError } from "@/lib/app-error";
import { setCsrfCookie } from "@/lib/csrf";

import { BodyText, Button, Card, Heading, PageSection } from "@/components/ui/primitives";
import { logoutAction } from "@/features/auth/actions";

export default async function LogoutPage() {
  try {
    const csrfToken = await setCsrfCookie();

    return (
      <PageSection>
        <Heading>Log out</Heading>
        <BodyText>Confirm to end your current session.</BodyText>
        <Card>
          <form action={logoutAction} className="flex flex-col gap-4">
            <input type="hidden" name="csrfToken" value={csrfToken.token} />
            <Button type="submit" variant="danger">
              Confirm logout
            </Button>
          </form>
        </Card>
      </PageSection>
    );
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

    return (
      <PageSection>
        <Heading>Log out</Heading>
        <Alert tone="error" role="alert">
          Unable to load logout right now. ({appError.code})
        </Alert>
      </PageSection>
    );
  }
}
