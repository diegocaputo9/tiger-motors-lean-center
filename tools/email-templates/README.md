# Sign-in emails

The two emails Supabase sends. Paste them in **Supabase → Authentication → Emails → Templates**:

| Template | Subject | Body |
|---|---|---|
| Confirm signup (new accounts) | `Confirm your email for Tiger Motors Lean` | `confirm-signup.html` |
| Magic Link (returning learners) | `Your sign-in link for Tiger Motors Lean` | `magic-link.html` |

The button links to tigermotorslean.com itself (`{{ .RedirectTo }}#token_hash={{ .TokenHash }}&type=email`), not to the
Supabase address. auth.js reads the token after the `#` and finishes the sign-in with `verifyOtp`. A link that points to the
same domain as the sender is much less likely to be filtered as phishing, and mail scanners that open links cannot use up
the one-time token, because the token is only read by the page's script.

`{{ .Data.first_name }}` is the name from the sign-up form. The logo is loaded from
https://tigermotorslean.com/logo-circle-dark.png, so keep that file on the site.

Sender (Supabase → Authentication → Emails → SMTP settings): `learn@tigermotorslean.com`, name `Tiger Motors Lean Education Center`.
