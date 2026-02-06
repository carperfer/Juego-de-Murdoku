/**
 * Integration test for Murdoku Game
 * 
 * Run with: npx ts-node src/app/components/__tests__/runTests.ts
 */

import { runMurdokuUniquenessTests } from './MurdokuGame.test';

// Mock the translation system for testing
const mockTranslations = {
  en: {
    suspects: {
      '1': 'Baron Scarlet',
      '2': 'Lady Azure',
      '3': 'Dr. Emerald',
      '4': 'Count Gold',
    },
    objects: {
      weapon: { name: 'Dagger', article: 'a' },
      poison: { name: 'Poison', article: 'a' },
      note: { name: 'Secret Note', article: 'a' },
      clue: { name: 'Fingerprint', article: 'a' },
    },
    cluePatterns: {
      object: '{suspect} was found at the location with {article} {object}.',
      objectInRow:
        '{suspect} is in row {position} where there is {article} {object}.',
      objectInColumn:
        '{suspect} is in column {position} where there is {article} {object}.',
      row: '{suspect} is hiding in row {position}.',
      column: '{suspect} is hiding in column {position}.',
    },
  },
};

// Mock puzzle generator for testing
function generateTestPuzzle() {
  // Simple test puzzle with guaranteed unique solution
  const solution = [
    { r: 0, c: 0, id: 1 as const },
    { r: 1, c: 2, id: 2 as const },
    { r: 2, c: 3, id: 3 as const },
    { r: 3, c: 1, id: 4 as const },
  ];

  // Create clues with variety
  const clues = [
    'Baron Scarlet is hiding in row 1.',
    'Lady Azure is in column 3 where there is a Secret Note.',
    'Dr. Emerald is in row 3 where there is a Fingerprint.',
    'Count Gold is hiding in column 2.',
  ];

  return { solution, clues };
}

// Run the tests
console.log('\n🎮 MURDOKU UNIQUENESS TEST SUITE');
console.log('================================\n');

const testResults = runMurdokuUniquenessTests(generateTestPuzzle, 50);

// Print detailed results
console.log('📋 Detailed Test Report:');
console.log(testResults.summary);

if (testResults.failedTests === 0) {
  console.log('✨ All tests passed! Puzzles are guaranteed to be unambiguous.');
  process.exit(0);
} else {
  console.log(
    `⚠️  ${testResults.failedTests} tests failed. Review puzzle generation algorithm.`
  );
  console.log('\nFailed Puzzles Details:');
  testResults.ambiguousPuzzles.forEach(puzzle => {
    console.log(`\nPuzzle #${puzzle.puzzleIndex}:`);
    console.log(`  Solutions found: ${puzzle.solutionsFound}`);
    console.log('  Clues:');
    puzzle.clues.forEach((clue, idx) => {
      console.log(`    ${idx + 1}. ${clue}`);
    });
  });
  process.exit(1);
}
