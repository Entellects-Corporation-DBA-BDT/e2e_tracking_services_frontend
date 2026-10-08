# Current Address and LinkedIn profile save fix

The personal section backend whitelist previously accepted only email from the collection payload, dropping Current Address while returning a successful save. It now permits email, current_address and linkedin_profile. The collection serializer persists the new LinkedIn field inside the existing encrypted candidate_collection JSON. No schema migration is required.

Personal Information now shows LinkedIn Profile instead of Facebook Profile, and its edit form includes an optional URL input. Existing Facebook data is retained internally; it is not relabeled as LinkedIn. Current Address is editable in employee creation, staff edits and own personal-profile edits. ID card Location uses the saved Current Address.

Deploy the complete rebuilt frontend and BOTH backend files:
- modules/employee/model.php
- modules/employee/EmployeeCollectionService.php

Frontend-only deployment does not fix saving against the old backend whitelist.

Validated frontend request fields, backend encrypted save/read round trips for staff and owners, preservation of unrelated family data, existing onboarding/document regression checks and PHP syntax.
