// 零依赖原生 JS 高仿真业务数据引擎
const SURNAMES = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴'];
const NAMES = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '艳', '勇', '杰', '娟'];
const COMPANIES = ['华东智慧园区建设集团', '星海云计算科技公司', '中科数字能源研究院', '天枢智能制造基地', '海川供应链管理中心'];
const PROJECTS = [
  { projectId: 'PRJ-2026-001', projectName: '智慧园区一期综合管控平台', manager: '张伟' },
  { projectId: 'PRJ-2026-002', projectName: '华东数据中心绿色扩容工程', manager: '李娜' },
  { projectId: 'PRJ-2026-003', projectName: '城市轨道交通智能调度系统', manager: '王强' },
  { projectId: 'PRJ-2026-004', projectName: '新能源微电网监测运维项目', manager: '陈敏' }
];

let seq = 1000;

export const faker = {
  id(prefix = 'ID') {
    seq += 1;
    return `${prefix}${new Date().getFullYear()}${seq}`;
  },
  cname() {
    return SURNAMES[Math.floor(Math.random() * SURNAMES.length)] +
           NAMES[Math.floor(Math.random() * NAMES.length)];
  },
  company() {
    return COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  },
  sharedProject() {
    return PROJECTS[Math.floor(Math.random() * PROJECTS.length)];
  },
  phone() {
    const prefixes = ['138', '139', '186', '158', '177'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    return p + String(Math.floor(10000000 + Math.random() * 90000000));
  },
  datetime(daysOffset = 0) {
    const d = new Date(Date.now() - daysOffset * 86400000 - Math.floor(Math.random() * 36000000));
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  },
  amount(min = 1000, max = 50000) {
    return Number((min + Math.random() * (max - min)).toFixed(2));
  },
  int(min = 1, max = 500) {
    return Math.floor(min + Math.random() * (max - min + 1));
  },
  pick(arr = []) {
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  },
  dateLabels(count = 7) {
    const list = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      list.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return list;
  },
  trendSeries(length = 7, min = 40, max = 180) {
    let cur = Math.floor((min + max) / 2);
    return Array.from({ length }, () => {
      const step = Math.floor((Math.random() - 0.45) * ((max - min) * 0.25));
      cur = Math.max(min, Math.min(max, cur + step));
      return cur;
    });
  },
  pieSeries(categories = ['进行中', '已完成', '待审核', '已暂停']) {
    return categories.map(name => ({ name, value: this.int(20, 200) }));
  },
  mockFileMeta(originalName) {
    const samples = ['2026年度项目立项报告.pdf', '系统架构设计说明书.docx', '设备采购清单明细.xlsx', '现场勘察验收照片.jpg'];
    const fileName = originalName || this.pick(samples);
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'pdf';
    return {
      fileId: this.id('FILE'),
      fileName,
      originalFilename: fileName,
      fileSize: `${(0.5 + Math.random() * 8.5).toFixed(2)} MB`,
      fileExt: ext,
      url: `/mock-files/${encodeURIComponent(fileName)}`,
      uploadTime: this.datetime(0)
    };
  }
};
