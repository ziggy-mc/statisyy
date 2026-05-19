import { setCsrfCookie } from "@/lib/csrf";

import { BodyText, Button, Card, Heading, PageSection } from "@/components/ui/primitives";
import { logoutAction } from "@/features/auth/actions";

export default async function LogoutPage() {
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
}
