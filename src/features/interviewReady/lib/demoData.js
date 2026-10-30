// Clearly-labeled fictional sample data for demo mode.
// NEVER presented as analysis of the user's actual resume.
export const DEMO_RESUME = `Jordan Rivera
Senior Frontend Engineer

Summary
Frontend engineer with 6 years of experience building responsive web applications in React, TypeScript, and CSS. Comfortable leading UI architecture and mentoring junior developers.

Experience
Senior Frontend Engineer | Brightwave Labs | 2021 - Present
- Led migration of a legacy Angular dashboard to React 18 and TypeScript, reducing bundle size by 32%.
- Built a design-system component library used across 4 product teams.
- Mentored 3 junior engineers through code reviews and pairing sessions.

Frontend Engineer | Northwind Commerce | 2018 - 2021
- Developed checkout flows in React and Redux used by 200k monthly users.
- Improved Lighthouse performance scores from 62 to 91 on key landing pages.
- Collaborated with backend engineers to design REST APIs.

Education
B.S. Computer Science, University of Washington, 2018

Skills
React, TypeScript, JavaScript, CSS, Tailwind, Redux, Jest, Webpack, Git, Accessibility (WCAG)`;
export const DEMO_JD = `Senior Frontend Engineer | Acme Cloud
Acme Cloud is building the next generation of developer tooling. We are hiring a Senior Frontend Engineer to own our web console.

Responsibilities
- Architect and build customer-facing web applications in React and TypeScript.
- Drive front-end performance, accessibility, and reliability.
- Collaborate with design and backend teams to ship features end-to-end.
- Mentor engineers and raise the team's engineering bar.

Requirements
- 5+ years of frontend engineering experience.
- Expert proficiency in React and TypeScript.
- Experience with modern build tooling (Vite, Webpack, or equivalent).
- Strong understanding of web accessibility (WCAG 2.1).
- Experience with CI/CD pipelines.
- Familiarity with backend-for-frontend patterns and GraphQL.
- Excellent communication and mentorship skills.

Nice to have
- Experience with design systems.
- Familiarity with testing at scale (Playwright, Cypress).`;
export const DEMO_ANALYSIS = {
    summary: 'This is DEMO analysis using fictional sample data, not analysis of your uploaded resume. It illustrates the kind of evidence-based comparison the application produces when the AI service is configured.',
    strengths: [
        '6 years of frontend experience meets the 5+ year requirement (demo data).',
        'Demonstrated React + TypeScript expertise across two roles (demo data).',
        'Concrete performance improvement work (Lighthouse 62 -> 91) (demo data).',
    ],
    supportedSkills: ['React', 'TypeScript', 'Webpack', 'Accessibility (WCAG)', 'Mentorship'],
    gaps: [
        'No evidence of CI/CD pipeline experience in the demo resume.',
        'GraphQL is not mentioned in the demo resume.',
        'Vite is not listed (Webpack is) (demo data).',
    ],
    transferableSkills: [
        'Design-system work could translate to Acme Cloud component architecture (demo data).',
        'Performance tuning skills are transferable to reliability work (demo data).',
    ],
    clarifications: [
        'Have you worked with CI/CD pipelines (GitHub Actions, Jenkins)? (demo question)',
        'Have you consumed or built GraphQL APIs? (demo question)',
    ],
    wordingSuggestions: [
        'Quantify the design-system adoption (number of teams, components).',
        'Lead the summary with the senior/architecture framing.',
    ],
    requirementMatches: [
        { requirement: '5+ years frontend experience', status: 'Supported', evidence: '6 years total (demo).', recommendedAction: 'Keep as is.' },
        { requirement: 'Expert React + TypeScript', status: 'Supported', evidence: 'Two roles using both (demo).', recommendedAction: 'Highlight architecture work.' },
        { requirement: 'Modern build tooling', status: 'Partially Supported', evidence: 'Webpack experience listed; Vite not mentioned (demo).', recommendedAction: 'Add Vite if you have used it.' },
        { requirement: 'WCAG 2.1 accessibility', status: 'Supported', evidence: 'WCAG listed in skills (demo).', recommendedAction: 'Cite a specific accessibility improvement.' },
        { requirement: 'CI/CD pipelines', status: 'Not Evidenced', evidence: null, recommendedAction: 'Add CI/CD experience if you have it. "Not evidenced" does not mean you lack it.' },
        { requirement: 'GraphQL', status: 'Not Evidenced', evidence: null, recommendedAction: 'Mention GraphQL usage if applicable.' },
        { requirement: 'Mentorship and communication', status: 'Supported', evidence: 'Mentored 3 junior engineers (demo).', recommendedAction: 'Keep and quantify outcomes.' },
    ],
};
export const DEMO_QUESTIONS = [
    { id: 'q1', index: 0, category: 'Technical', text: 'Walk me through how you would migrate a legacy Angular app to React 18. What are the key risks?', intent: 'Assess architecture and migration planning.' },
    { id: 'q2', index: 1, category: 'Project Experience', text: 'Tell me about the design-system component library you led. How did you drive adoption across teams?', intent: 'Probe leadership and reuse.' },
    { id: 'q3', index: 2, category: 'Behavioral', text: 'Describe a time you disagreed with a designer on a UX decision. How did you resolve it?', intent: 'Assess collaboration.' },
    { id: 'q4', index: 3, category: 'Situational', text: 'A key page is slow in production. How would you diagnose and prioritize fixes?', intent: 'Assess performance debugging.' },
    { id: 'q5', index: 4, category: 'Gap Exploration', text: 'The role involves CI/CD pipelines. Can you describe any experience you have with CI/CD?', intent: 'Honestly explore a gap.' },
    { id: 'q6', index: 5, category: 'Technical', text: 'What is the difference between useMemo and useCallback, and when would you avoid them?', intent: 'Assess React internals.' },
    { id: 'q7', index: 6, category: 'Project Experience', text: 'How did you measure the Lighthouse improvement from 62 to 91? What changes had the biggest impact?', intent: 'Probe metrics and method.' },
    { id: 'q8', index: 7, category: 'Behavioral', text: 'Tell me about a time you mentored a struggling junior engineer. What was the outcome?', intent: 'Assess mentorship depth.' },
    { id: 'q9', index: 8, category: 'Situational', text: 'A backend team proposes a GraphQL API but you have only used REST. How do you approach this?', intent: 'Assess adaptability.' },
    { id: 'q10', index: 9, category: 'Gap Exploration', text: 'The role lists familiarity with Playwright or Cypress. Do you have end-to-end testing experience?', intent: 'Honestly explore a gap.' },
];
export const DEMO_FEEDBACK = {
    doneWell: ['Structured the answer clearly.', 'Referenced a concrete project (demo).'],
    missingOrUnclear: ['Did not quantify the impact.', 'Skipped the risk discussion.'],
    corrections: [],
    improvements: ['Add a measurable outcome.', 'Name one specific risk and mitigation.'],
    strongerExample: '[DEMO] In my migration at Brightwave, I reduced bundle size 32% by code-splitting and removing unused deps; the key risk was regression in shared routes, which I mitigated with feature flags.',
    structure: 'STAR',
    ratings: [
        { dimension: 'Relevance', score: 4, rationale: 'On topic but light on detail (demo).' },
        { dimension: 'Clarity & Structure', score: 4, rationale: 'Easy to follow (demo).' },
        { dimension: 'Depth & Examples', score: 3, rationale: 'Needed a concrete metric (demo).' },
    ],
    note: 'This is DEMO feedback based on fictional data, not a real assessment of your answer.',
};
export const DEMO_TAILORED = {
    professionalSummary: '[DEMO] Senior Frontend Engineer with 6 years building accessible, performant React and TypeScript applications. Led a design-system adoption across 4 teams and mentored engineers; experienced in performance engineering and front-end architecture.',
    skills: ['React', 'TypeScript', 'Accessibility (WCAG 2.1)', 'Performance Engineering', 'Design Systems', 'Mentorship', 'Redux', 'Jest', 'Webpack', 'Git'],
    experience: [
        {
            title: 'Senior Frontend Engineer',
            company: 'Brightwave Labs',
            dates: '2021 - Present',
            bullets: [
                '[DEMO] Led migration from legacy Angular to React 18 + TypeScript, cutting bundle size 32% and improving load time for 200k monthly users.',
                '[DEMO] Built and maintained a design-system component library adopted by 4 product teams, improving UI consistency.',
                '[DEMO] Mentored 3 junior engineers via code reviews and pairing; two were promoted within a year.',
            ],
        },
        {
            title: 'Frontend Engineer',
            company: 'Northwind Commerce',
            dates: '2018 - 2021',
            bullets: [
                '[DEMO] Developed React/Redux checkout flows serving 200k monthly users with a focus on accessibility.',
                '[DEMO] Raised Lighthouse performance scores from 62 to 91 on key landing pages through code-splitting and image optimization.',
                '[DEMO] Partnered with backend engineers to design REST APIs for the checkout domain.',
            ],
        },
    ],
    education: ['B.S. Computer Science, University of Washington, 2018'],
    certifications: [],
    projects: [],
    clarificationsNeeded: ['Have you used CI/CD pipelines? (demo)', 'Have you worked with GraphQL? (demo)'],
    changeLog: [
        { section: 'Professional Summary', change: 'Rewritten to lead with senior/architecture framing (demo).', type: 'rewritten' },
        { section: 'Skills', change: 'Reordered to surface accessibility and performance first (demo).', type: 'reordered' },
        { section: 'Experience bullets', change: 'Sharpened with existing metrics from the resume (demo).', type: 'rewritten' },
    ],
    fullText: '',
};
export const DEMO_REPORT = {
    answeredCount: 10,
    skippedCount: 0,
    perQuestion: DEMO_QUESTIONS.map((q) => ({
        questionId: q.id,
        question: q.text,
        category: q.category,
        skipped: false,
        ratings: DEMO_FEEDBACK.ratings,
        feedbackSummary: 'DEMO feedback summary.',
    })),
    strongestAreas: ['React fundamentals (demo).', 'Mentorship stories (demo).'],
    improvementAreas: ['Quantifying impact (demo).', 'Risk discussions (demo).'],
    topicsToStudy: ['CI/CD pipelines (demo).', 'GraphQL basics (demo).', 'Playwright/Cypress (demo).'],
    practicePlan: [
        { day: 'Day 1', activity: 'Review CI/CD concepts', focus: 'GitHub Actions basics' },
        { day: 'Day 2', activity: 'Build a small GraphQL query', focus: 'Schema and resolvers' },
        { day: 'Day 3', activity: 'Write one Playwright test', focus: 'E2E testing' },
    ],
    overallNote: 'This is a DEMO report using fictional data, not a real assessment.',
    incomplete: false,
};
