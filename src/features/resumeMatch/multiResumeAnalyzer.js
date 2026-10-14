// Multi-resume scoring engine — compares a job description against multiple
// candidate resumes, ranking by keyword match strength.
import { SKILLS_DATABASE, CATEGORY_LABELS } from './skillsDatabase';
const CATEGORY_WEIGHTS = {
    technical: 0.35,
    tools: 0.25,
    soft: 0.15,
    domain: 0.15,
    education: 0.10,
};
function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s+#./-]/g, ' ').replace(/\s+/g, ' ').trim();
}
function findSkillInText(text, skillName, aliases) {
    const terms = [skillName, ...(aliases || [])].map((t) => t.toLowerCase());
    for (const term of terms) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|[^\\w])${escaped}([^\\w]|$)`, 'g');
        if (regex.test(text))
            return true;
    }
    return false;
}
function generateExplanation(score, matched, missing, candidate) {
    const topMatches = matched.slice(0, 5).map((m) => m.keyword);
    const parts = [];
    if (score >= 80) {
        parts.push('Excellent match.');
    }
    else if (score >= 60) {
        parts.push('Strong match.');
    }
    else if (score >= 40) {
        parts.push('Moderate match.');
    }
    else if (score >= 20) {
        parts.push('Weak match.');
    }
    else {
        parts.push('Minimal match.');
    }
    if (topMatches.length > 0) {
        parts.push(`Matches on ${topMatches.join(', ')}`);
    }
    const topMissing = missing.slice(0, 3).map((m) => m.keyword);
    if (topMissing.length > 0) {
        parts.push(`Missing: ${topMissing.join(', ')}`);
    }
    if (candidate.experience > 0) {
        parts.push(`${candidate.experience} yrs experience`);
    }
    return parts.join(' — ');
}
export function scoreCandidate(candidate, jobDescription) {
    const normalizedResume = normalize(candidate.resumeText || candidate.skills.join(' '));
    const normalizedJd = normalize(jobDescription);
    const keywordMatches = [];
    const matchedKeywords = [];
    const missingKeywords = [];
    for (const skill of SKILLS_DATABASE) {
        const inJd = findSkillInText(normalizedJd, skill.name, skill.aliases);
        if (!inJd)
            continue;
        const inResume = findSkillInText(normalizedResume, skill.name, skill.aliases);
        const match = {
            keyword: skill.name,
            inJobDescription: true,
            inResume,
            category: skill.category,
        };
        keywordMatches.push(match);
        if (inResume) {
            matchedKeywords.push(match);
        }
        else {
            missingKeywords.push(match);
        }
    }
    // Category scores
    const categories = Object.keys(CATEGORY_LABELS);
    const categoryScores = categories.map((cat) => {
        const total = keywordMatches.filter((m) => m.category === cat).length;
        const matched = matchedKeywords.filter((m) => m.category === cat).length;
        const percentage = total > 0 ? Math.round((matched / total) * 100) : 0;
        return {
            category: cat,
            label: CATEGORY_LABELS[cat],
            matched,
            total,
            percentage,
        };
    });
    // Weighted overall score
    let score = 0;
    let totalWeight = 0;
    for (const cs of categoryScores) {
        if (cs.total > 0) {
            const weight = CATEGORY_WEIGHTS[cs.category] || 0.1;
            score += cs.percentage * weight;
            totalWeight += weight;
        }
    }
    score = totalWeight > 0 ? Math.round(score / totalWeight) : 0;
    const explanation = generateExplanation(score, matchedKeywords, missingKeywords, candidate);
    return {
        candidate,
        score,
        matchedKeywords,
        missingKeywords,
        explanation,
        categoryScores,
    };
}
export function rankCandidates(candidates, jobDescription) {
    const scored = candidates.map((c) => scoreCandidate(c, jobDescription));
    scored.sort((a, b) => b.score - a.score);
    return scored;
}
