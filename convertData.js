/* eslint-env node */
/* eslint no-console:0 */
const yaml = require('js-yaml');
const { readFileSync, writeFileSync } = require('fs');
const { extname, join } = require('path');
const dashify = require('dashify');
const walkSync = require('walk-sync');
const yamlFront = require('yaml-front-matter');

const mdFiles = walkSync('source')
  .filter(path => ['.md', '.markdown'].includes(extname(path)));

const existingAuthors = {};

mdFiles.forEach(async postFilename => {
  const file = readFileSync(join('source', postFilename));

  let front;
  try {
    front = yamlFront.loadFront(file);
  } catch (e) {
    console.error('bad data in', postFilename);
    return;
  }

  const content = front.__content;
  delete front.__content;

  const match = postFilename.match(/(\d\d\d\d-\d\d-\d\d)-(.*)\..*/);

  if(!match) {
    return;
  }

  let authors = []
  if(front.author) {
    authors = front.author.split(',').map(author => ({
      name: author.trim(),
      id: dashify(author.trim().toLowerCase()),
    }));
  }

  authors.forEach(author => {
    if(!existingAuthors[author.id]) {
      let authorData = {
        name: author.name,
        image: '',
        cover: '',
        website: '',
        twitter: '',
        location: '',
      }

      writeFileSync(join('author', `${author.id}.md`), `---
${yaml.safeDump(authorData)}---
`);
      existingAuthors[author.id] = author;
    }
  })

  const data = {
    title: front.title || '',
    authors: authors.map(author => author.id),
    date: new Date(match[1]),
    tags: front.tags ? front.tags.split(',').map(tag => dashify(tag.trim().toLowerCase()), { condense: true }) : []
  }

  let yamlData
  try {
    yamlData = yaml.safeDump(data);
  } catch (e) {
    console.error('error while writing data', e, data);
    return;
  }

  writeFileSync(join('content', `${match[2]}.md`), `---
${yamlData}---
${content}`);
})
