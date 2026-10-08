# Employee profile ID cards

An eye button beside an assigned employee ID opens front/back card previews and downloads a two-page 54 x 85.6 mm portrait PDF. The magenta, black and white design with finished edge accents uses the existing BeeData logo, saved employee profile photo, employee ID, name, role, joining date and location (saved Current Address). Current Address is editable in the personal employee editor for self-service and staff. PDF text wraps inside bounded regions without cutting the address to a fixed character count. Missing values show Not recorded rather than invented information. Cards without an assigned employee ID are unavailable.

PDF text and shapes are vector based; portrait images are embedded at high resolution. QR codes open the employee profile on the current application domain, where normal login and permission checks apply. This is authenticated profile verification, not public verification. No public employee data endpoint was added. HR email is hr_ind@bedatatech.com. Department is omitted. Company website matches the supplied text. The signature area remains blank for an actual authorized signature.

Deploy the full frontend build including its new lazy-loaded JavaScript chunks. No backend update or SQL migration is required for ID cards. npm install/npm ci installs the added jspdf and qrcode dependencies.

Verified PDF page count and dimensions, saved details, secure photo loading, modal focus handling, loading failures, existing profile tests, desktop/mobile rendering and real browser PDF download.
