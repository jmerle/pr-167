export function isMultiNumber(url: string, doc: Document): boolean {
  const inputSpecification = doc.querySelector('.input-specification');
  if (inputSpecification === null) {
    return false;
  }

  const testTypeKeywords = ['test cases', 'testcases', 'наборов', 'тестовых', 'случаев'];
  return testTypeKeywords.some(keyword => inputSpecification.textContent.includes(keyword));
}
