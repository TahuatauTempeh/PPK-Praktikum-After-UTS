const {
  collectSpecs,
  extractPrdIds,
  parseCoverage,
  parseManifest,
  parseYamlTags,
  validate,
} = require('./check-coverage');

describe('check-coverage', () => {
  it('extracts unique UAT IDs from PRD text', () => {
    const text = 'UAT-LAB-01 ... UAT-ATT-02 ... UAT-LAB-01';
    expect(extractPrdIds(text)).toEqual(['UAT-ATT-02', 'UAT-LAB-01']);
  });

  it('parses exactly six coverage columns', () => {
    const text = [
      '| ID | Ringkasan | Tier | Platform | Bukti otomatis | Status |',
      '|---|---|---|---|---|---|',
      '| UAT-LAB-01 | Tambah lab | critical | web | e2e/web/specs/lab-session.e2e.ts::asisten menyiapkan lab | covered |',
    ].join('\n');
    expect(parseCoverage(text)).toEqual([
      {
        id: 'UAT-LAB-01',
        summary: 'Tambah lab',
        tier: 'critical',
        platform: 'web',
        evidence: 'e2e/web/specs/lab-session.e2e.ts::asisten menyiapkan lab',
        status: 'covered',
      },
    ]);
  });

  it('parses manifest rows and skips comments', () => {
    const text = '# name\ttier\tlon\tlat\temail\nflow-a\tcritical\t110\t-7\ta@test.local\n';
    expect(parseManifest(text)).toEqual([
      { name: 'flow-a', tier: 'critical', lon: '110', lat: '-7', email: 'a@test.local' },
    ]);
  });

  it('parses YAML frontmatter tags as a list', () => {
    const text = 'appId: x\ntags:\n  - android\n  - uat\n---\n- launchApp\n';
    expect(parseYamlTags(text)).toEqual(['android', 'uat']);
  });

  it('flattens Playwright suites and keeps spec files', () => {
    const suites = [
      {
        file: 'auth.e2e.ts',
        specs: [{ title: 'login', tags: ['uat'], file: 'auth.e2e.ts' }],
        suites: [
          {
            file: 'auth.e2e.ts',
            specs: [{ title: 'logout', tags: ['uat'], file: 'auth.e2e.ts' }],
          },
        ],
      },
    ];
    expect(collectSpecs(suites)).toEqual([
      { title: 'login', tags: ['uat'], file: 'auth.e2e.ts' },
      { title: 'logout', tags: ['uat'], file: 'auth.e2e.ts' },
    ]);
  });

  it('reports missing, duplicate, and untagged specs', () => {
    const errors = validate({
      prdIds: ['UAT-LAB-01', 'UAT-LAB-02'],
      rows: [
        {
          id: 'UAT-LAB-01',
          summary: 'x',
          tier: 'critical',
          platform: 'web',
          evidence: 'e2e/web/specs/lab.e2e.ts::lab',
          status: 'covered',
        },
        {
          id: 'UAT-LAB-01',
          summary: 'x',
          tier: 'critical',
          platform: 'web',
          evidence: 'e2e/web/specs/lab.e2e.ts::lab',
          status: 'covered',
        },
      ],
      specs: [{ title: 'lab', tags: [], file: 'lab.e2e.ts' }],
      manifest: [],
      yamlTags: new Map(),
      manualIds: new Set(),
      strict: false,
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        'duplikat: UAT-LAB-01',
        'hilang: UAT-LAB-02',
        'test tanpa tepat satu tag tier: lab.e2e.ts::lab',
      ]),
    );
  });

  it('rejects pending status only in strict mode', () => {
    const input = {
      prdIds: ['UAT-LAB-01'],
      rows: [
        {
          id: 'UAT-LAB-01',
          summary: 'x',
          tier: 'uat',
          platform: 'web',
          evidence: 'e2e/web/specs/lab.e2e.ts::lab',
          status: 'pending',
        },
      ],
      specs: [{ title: 'lab', tags: ['uat'], file: 'lab.e2e.ts' }],
      manifest: [],
      yamlTags: new Map(),
      manualIds: new Set(),
      strict: false,
    };
    expect(validate(input)).toEqual([]);
    expect(validate({ ...input, strict: true })).toEqual([
      'UAT-LAB-01: status belum final (pending)',
    ]);
  });
});
