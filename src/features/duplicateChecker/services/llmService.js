import { delay } from '../mocks/delay';
import { findScenario } from '../mocks/sampleStories';
import { tokenize, topWords } from '../lib/text';
const UNDERSTANDING_DELAY_MS = 1200;
const KEYWORD_LIMIT = 8;
function firstSentence(text) {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}
export const mockLlmService = {
  async understandStory(storyText) {
    await delay(UNDERSTANDING_DELAY_MS);
    const paragraphs = storyText.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);
    const body = paragraphs.length > 1 ? paragraphs.slice(1).join(' ') : paragraphs[0] ?? '';
    const words = tokenize(storyText);
    const scenario = findScenario(words);
    return {
      summary: body ? firstSentence(body) : 'No story details were provided.',
      businessGoal: scenario?.understanding.businessGoal ?? 'No clear business goal was found in the story text.',
      keywords: topWords(words, KEYWORD_LIMIT),
      entities: scenario?.understanding.entities ?? []
    };
  },
  async scoreSimilarity(story, candidate) {
    const storyWords = new Set(tokenize(`${story.title} ${story.description}`));
    const candidateWords = new Set(tokenize(`${candidate.title} ${candidate.description}`));
    const shared = [...storyWords].filter(word => candidateWords.has(word)).length;
    const union = new Set([...storyWords, ...candidateWords]).size;
    return union === 0 ? 0 : Math.round(shared / union * 100);
  }
};
export const realLlmService = {
  async understandStory() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  },
  async scoreSimilarity() {
    throw new Error('Live connections are not implemented in the supplied Duplicate Checker. Enable Demo mode to use the original sample scenarios.');
  }
};
