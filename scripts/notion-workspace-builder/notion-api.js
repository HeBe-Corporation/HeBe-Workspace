// Notion API Helper
const https = require('https');
const config = require('./config');

// API 요청 헬퍼
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'api.notion.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${config.NOTION_TOKEN}`,
        'Notion-Version': config.NOTION_VERSION,
        'Content-Type': 'application/json'
      }
    };
    if (bodyStr) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, error: parsed });
          } else {
            resolve({ status: res.statusCode, data: parsed });
          }
        } catch (e) {
          reject({ status: res.statusCode, error: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// 페이지 생성
async function createPage(parentId, title, icon = null, cover = null) {
  const body = {
    parent: { page_id: parentId },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }]
      }
    }
  };
  if (icon) body.icon = { type: 'emoji', emoji: icon };
  if (cover) body.cover = { type: 'external', external: { url: cover } };

  const result = await makeRequest('POST', '/v1/pages', body);
  console.log(`  ✓ 페이지 생성: ${title} (${result.data.id})`);
  return result.data;
}

// 데이터베이스 생성
async function createDatabase(parentId, title, icon, properties) {
  const body = {
    parent: { page_id: parentId },
    title: [{ type: 'text', text: { content: title } }],
    icon: { type: 'emoji', emoji: icon },
    properties: properties
  };

  const result = await makeRequest('POST', '/v1/databases', body);
  console.log(`  ✓ DB 생성: ${title} (${result.data.id})`);
  return result.data;
}

// 데이터베이스에 항목 추가
async function createDatabaseItem(databaseId, properties) {
  const body = {
    parent: { database_id: databaseId },
    properties: properties
  };

  const result = await makeRequest('POST', '/v1/pages', body);
  return result.data;
}

// 블록 추가
async function appendBlocks(pageId, blocks) {
  const result = await makeRequest('PATCH', `/v1/blocks/${pageId}/children`, {
    children: blocks
  });
  return result.data;
}

// 제목 블록 생성
function heading1Block(text) {
  return {
    type: 'heading_1',
    heading_1: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function heading2Block(text) {
  return {
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function heading3Block(text) {
  return {
    type: 'heading_3',
    heading_3: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

// 문단 블록
function paragraphBlock(text) {
  return {
    type: 'paragraph',
    paragraph: {
      rich_text: text ? [{ type: 'text', text: { content: text } }] : []
    }
  };
}

// 구분선
function dividerBlock() {
  return { type: 'divider', divider: {} };
}

// 콜아웃 블록
function calloutBlock(text, icon = '💡') {
  return {
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: icon },
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

// 토글 블록
function toggleBlock(title, children = []) {
  return {
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: title } }],
      children: children
    }
  };
}

// 데이터베이스 링크 블록
function linkedDatabaseBlock(databaseId) {
  return {
    type: 'link_to_page',
    link_to_page: {
      type: 'database_id',
      database_id: databaseId
    }
  };
}

// 컬럼 블록
function columnListBlock(columns) {
  return {
    type: 'column_list',
    column_list: {
      children: columns.map(col => ({
        type: 'column',
        column: { children: col }
      }))
    }
  };
}

// 속성 빌더 헬퍼
const PropertyBuilder = {
  title() {
    return { title: {} };
  },

  richText() {
    return { rich_text: {} };
  },

  number(format = 'number') {
    return { number: { format } };
  },

  select(options) {
    return {
      select: {
        options: options.map((opt, i) => {
          if (typeof opt === 'string') {
            return { name: opt };
          }
          return { name: opt.name, color: opt.color };
        })
      }
    };
  },

  multiSelect(options) {
    return {
      multi_select: {
        options: options.map((opt, i) => {
          if (typeof opt === 'string') {
            return { name: opt };
          }
          return { name: opt.name, color: opt.color };
        })
      }
    };
  },

  date() {
    return { date: {} };
  },

  checkbox() {
    return { checkbox: {} };
  },

  url() {
    return { url: {} };
  },

  email() {
    return { email: {} };
  },

  phoneNumber() {
    return { phone_number: {} };
  },

  files() {
    return { files: {} };
  },

  people() {
    return { people: {} };
  },

  relation(databaseId, isTwoWay = false, syncPropertyName = null) {
    const rel = {
      relation: {
        database_id: databaseId,
        type: 'single_property',
        single_property: {}
      }
    };
    return rel;
  },

  formula(expression) {
    return {
      formula: { expression }
    };
  },

  status(options) {
    return {
      status: {
        options: options.map(opt => {
          if (typeof opt === 'string') {
            return { name: opt };
          }
          return { name: opt.name, color: opt.color };
        })
      }
    };
  }
};

// 딜레이 함수 (API rate limit 대응)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  makeRequest,
  createPage,
  createDatabase,
  createDatabaseItem,
  appendBlocks,
  heading1Block,
  heading2Block,
  heading3Block,
  paragraphBlock,
  dividerBlock,
  calloutBlock,
  toggleBlock,
  linkedDatabaseBlock,
  columnListBlock,
  PropertyBuilder,
  delay
};
