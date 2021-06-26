import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { isMultiNumber } from './implementation';

export function getUrl(urlSuffix: string, locale: string): string {
  return `https://codeforces.com/${urlSuffix}?locale=${locale}`;
}

export async function download(urlSuffix: string, locale: string): Promise<string> {
  const cacheFile = path.resolve(__dirname, '../cache', urlSuffix, `${locale}.html`);

  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile).toString();
  }

  const response = await axios.get(getUrl(urlSuffix, locale));

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, response.data);

  return response.data;
}

export function generateDetails(label: string, urls: string[]): string {
  return `
<details>
<summary>${label} (${urls.length})</summary>

${urls.map(url => `- [${url}](${url})`).join('\n')}

</details>
  `.trim();
}

(async () => {
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data.json')).toString());

  const problemMultiNumberPRMultiNumber: string[] = [];
  const problemSinglePRSingle: string[] = [];
  const problemMultiNumberPRSingle: string[] = [];
  const problemSinglePRMultiNumber: string[] = [];
  const errored: string[] = [];

  let index = 1;
  const total = Object.keys(data).length * 2;

  for (const urlSuffix of Object.keys(data)) {
    const problemMultiNumber = data[urlSuffix];

    for (const locale of ['en', 'ru']) {
      const url = getUrl(urlSuffix, locale);

      try {
        const html = await download(urlSuffix, locale);
        const doc = new JSDOM(html).window.document;

        const prMultiNumber = isMultiNumber(url, doc);

        if (problemMultiNumber && prMultiNumber) {
          console.log(`[${index}/${total}] [Multi/Multi] ${url}`);
          problemMultiNumberPRMultiNumber.push(url);
        } else if (!problemMultiNumber && !prMultiNumber) {
          console.log(`[${index}/${total}] [Single/Single] ${url}`);
          problemSinglePRSingle.push(url);
        } else if (problemMultiNumber && !prMultiNumber) {
          console.log(`[${index}/${total}] [Multi/Single] ${url}`);
          problemMultiNumberPRSingle.push(url);
        } else if (!problemMultiNumber && prMultiNumber) {
          console.log(`[${index}/${total}] [Single/Multi] ${url}`);
          problemSinglePRMultiNumber.push(url);
        }
      } catch (err) {
        console.error(`[${index}/${total}] [Error] ${url}`);
        console.error(err);
        errored.push(url);
      }

      index++;
    }
  }

  const blocks = [
    generateDetails('Problem is multi number, PR marks it as multi number', problemMultiNumberPRMultiNumber),
    generateDetails('Problem is single, PR marks it as single', problemSinglePRSingle),
    generateDetails('Problem is multi number, PR marks it as single', problemMultiNumberPRSingle),
    generateDetails('Problem is single, PR marks it as multi number', problemSinglePRMultiNumber),
    generateDetails('Error', errored),
  ];

  const resultsFile = path.resolve(__dirname, '../cache/results.md');
  fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
  fs.writeFileSync(resultsFile, blocks.join('\n\n') + '\n');
})();
