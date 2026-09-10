# Pre-CMO Deployment Checklist

Before executing the Post-Deployment Marketing Strategy, strict operational security (OPSEC) must be enforced. This shields personal details from public exposure, scammers, and unsavory communication. 

**DO NOT** authorize the CMO agent to execute external webhooks or schedule campaigns until all manual requirements are verified.

## Manual Requirements

- [ ] **Requirement 1: Acquire Non-Personal Credentials**
  Establish a local PO Box or a virtual business address. Do not use your home address for any public-facing corporate documents or footers.

- [ ] **Requirement 2: Acquire Support Phone Number**
  Acquire a dedicated virtual VoIP phone number for customer-facing support. Do not use your personal cell phone number.

- [ ] **Requirement 3: Update Stripe Public Business Profile**
  Log into the Stripe dashboard. Update the Public Business Profile with the masked business address, the new VoIP support number, and the official support email.

- [ ] **Requirement 4: Sanitize Public Code & Documents**
  Sanitize all site footers, terms of service, and privacy policies. Ensure no personal names, addresses, or unmasked contact details are exposed in the repository or live site.

- [ ] **Requirement 5: Disarm the Lockdown**
  Once all steps above are fully complete and verified, create an empty file named `OPSEC_CLEARED.flag` in the root directory. This will manually disarm the OPSEC lockdown and authorize the CMO Agent for external deployment.
