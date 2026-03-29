const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const outDir = path.join(__dirname, '..', 'out');
const scriptsDir = path.join(outDir, 'ext-scripts'); // Changed to ext- prefix

if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

/**
 * Extracts inline scripts from HTML content and saves them as external files.
 */
function externalizeScripts(htmlContent, htmlFilePath) {
  let updatedHtml = htmlContent;
  const scriptRegex = /<script\b(?![^>]*\bsrc\b)(?:(?!type\b)|[^>]*\btype=["'](?:text\/javascript|module|)["'])[^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const fullTag = match[0];
    const scriptContent = match[1].trim();

    if (scriptContent.length > 0) {
      const hash = crypto.createHash('md5').update(scriptContent).digest('hex').substring(0, 8);
      const filename = `inline-${hash}.js`;
      const scriptPath = path.join(scriptsDir, filename);

      fs.writeFileSync(scriptPath, scriptContent, 'utf8');
      
      const newTag = `<script src="/ext-scripts/${filename}"></script>`;
      updatedHtml = updatedHtml.replace(fullTag, newTag);
    }
  }

  return updatedHtml;
}

/**
 * Recursively walk the directory and perform:
 * 1. Renaming of underscore prefixes
 * 2. Externalizing inline scripts in HTML files
 * 3. Collecting path mappings for reference updates
 */
function processDirectory(dir, mappings = []) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const oldPath = path.join(dir, item);
    let newItemName = item;

    // 1. Rename underscore items
    if (item.startsWith('_')) {
      // Use 'ext-' prefix instead of 'assets_'. 
      // NO UNDERSCORE in the prefix to avoid recursive replacement issues!
      newItemName = item.replace(/^_+/, 'ext-'); 
      const newPath = path.join(dir, newItemName);
      
      console.log(`Renaming: ${item} -> ${newItemName}`);
      if (fs.existsSync(newPath)) {
        fs.rmSync(newPath, { recursive: true, force: true });
      }
      fs.renameSync(oldPath, newPath);
      
      // Specifically target path-like strings
      mappings.push({ find: `/_${item.substring(1)}/`, replace: `/ext-${item.substring(1)}/` });
      mappings.push({ find: `"${item}/`, replace: `"ext-${item.substring(1)}/` });
      mappings.push({ find: `'${item}/`, replace: `'ext-${item.substring(1)}/` });
      // Add a naked one but be aware it's riskier - only if it has a trailing slash
      mappings.push({ find: `${item}/`, replace: `ext-${item.substring(1)}/` });
    }

    const currentPath = path.join(dir, newItemName);
    if (fs.statSync(currentPath).isDirectory()) {
      processDirectory(currentPath, mappings);
    } else if (currentPath.endsWith('.html')) {
        let content = fs.readFileSync(currentPath, 'utf8');
        const originalContent = content;
        content = externalizeScripts(content, currentPath);
        if (content !== originalContent) {
           fs.writeFileSync(currentPath, content, 'utf8');
        }
    }
  });

  return mappings;
}

/**
 * Perform global replacement in all text files using a single-pass approach
 */
function replaceAllInDir(dir, findReplaceList) {
  const files = fs.readdirSync(dir);

  // Filter out any potential duplicates or empty finds
  const uniqueMappings = findReplaceList.filter((m, index, self) => 
    m.find && self.findIndex(t => t.find === m.find) === index
  );

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      replaceAllInDir(filePath, uniqueMappings);
    } else if (
      filePath.endsWith('.html') ||
      filePath.endsWith('.js') ||
      filePath.endsWith('.css') ||
      filePath.endsWith('.json') ||
      filePath.endsWith('.txt')
    ) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Use a single loop but do NOT use global replace if it's already a fixed result
      // Actually, since our prefix 'ext-' doesn't start with '_', 
      // simple ordered replacement is safer now.
      uniqueMappings.sort((a, b) => b.find.length - a.find.length).forEach(({ find, replace }) => {
        if (content.includes(find)) {
          // console.log(`  Replacing ${find} with ${replace}`);
          const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          content = content.replace(regex, replace);
          changed = true;
        }
      });

      if (changed) {
        console.log(`Updated references in: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  });
}

console.log('--- Phase 1: Renaming & Script Externalizing ---');
const initialMappings = [
  { find: '/_next/', replace: '/ext-next/' },
  { find: '_next/', replace: 'ext-next/' }
];
const allMappings = processDirectory(outDir, initialMappings);

console.log('--- Phase 2: Updating internal references ---');
replaceAllInDir(outDir, allMappings);

console.log('✅ Extension paths fixed successfully (no-underscore-conflict iteration)');
