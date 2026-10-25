# Sign-in emails

Branded versions of the two emails Supabase sends. Paste them in **Supabase → Authentication → Emails → Templates**:

| Template | Subject | Body |
|---|---|---|
| Confirm signup (brand-new accounts) | `Welcome to Tiger Motors Lean: confirm your email` | `confirm-signup.html` |
| Magic Link (returning learners) | `Your Tiger Motors Lean sign-in link` | `magic-link.html` |

`{{ .ConfirmationURL }}` is the sign-in link and `{{ .Data.first_name }}` the name from the sign-up form. The logo is loaded from https://tigermotorslean.com/logo-circle-dark.png, so keep that file on the site.
