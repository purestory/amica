const fs = require('fs');
const path = require('path');

// 탐색할 디렉토리
const srcDir = path.join(__dirname, '..', 'src');

// 수정된 파일 카운트
let modifiedFiles = 0;

// 대상 확장자
const targetExtensions = ['.tsx', '.ts'];

// 파일 내 i18n 관련 임포트 변경 함수
function replaceI18nImports(filePath, content) {
  let modified = false;
  let newContent = content;

  // 1. react-i18next에서 useTranslation, Trans 등 임포트하는 라인 변경
  const reactI18NextRegex = /import\s+{([^}]*)}\s+from\s+['"]react-i18next['"]/g;
  if (reactI18NextRegex.test(content)) {
    newContent = newContent.replace(reactI18NextRegex, 
      "import {$1} from '@/utils/i18n-stubs'");
    modified = true;
  }

  // 2. @/i18n 임포트 변경
  if (newContent.includes("import '@/i18n'")) {
    newContent = newContent.replace(
      "import '@/i18n'",
      "import '@/utils/i18n-stubs'"
    );
    modified = true;
  }

  // 3. @/i18n/langs 임포트 변경
  const i18nLangsRegex = /import\s+{([^}]*)}\s+from\s+['"]@\/i18n\/langs['"]/g;
  if (i18nLangsRegex.test(newContent)) {
    newContent = newContent.replace(i18nLangsRegex, 
      "import {$1} from '@/utils/i18n-stubs'");
    modified = true;
  }

  return { modified, newContent };
}

// 디렉토리 순회 함수
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // i18n 디렉토리는 건너뜀 (나중에 삭제할 예정)
      if (entry.name === 'i18n') {
        console.log(`Skipping i18n directory: ${fullPath}`);
        continue;
      }
      processDirectory(fullPath);
    } else if (entry.isFile() && targetExtensions.includes(path.extname(entry.name))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const { modified, newContent } = replaceI18nImports(fullPath, content);

        if (modified) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Modified: ${fullPath}`);
          modifiedFiles++;
        }
      } catch (error) {
        console.error(`Error processing file ${fullPath}:`, error);
      }
    }
  }
}

// 실행
console.log('Starting i18n imports replacement...');
processDirectory(srcDir);
console.log(`Completed! Modified ${modifiedFiles} files.`); 