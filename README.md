# nalula-site-api
Complete web/mobile backend combining Nalula-API and nalula-user-api with the following modifications:
* replace the Auth0 username/password login with Twilio Verify and Passport (passwordless phone-number only)
* protect all the routes with CORS so only requests from nalula.com are allowed
* protect all the logged-in-only routes (fave management etc) with Twilio Verify and Passport
